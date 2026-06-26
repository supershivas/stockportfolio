// Proxy Yahoo Finance quote endpoint to get dividend data.
// GET /api/dividend?ticker=TTE.PA
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const ticker = req.query?.ticker?.trim()
  if (!ticker) return res.status(400).json({ error: 'Missing ticker' })

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
  const summaryUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=summaryDetail,defaultKeyStatistics,assetProfile`

  try {
    const [chartRes, summaryRes] = await Promise.all([
      fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; portfolio-app/1.0)', Accept: 'application/json' } }),
      fetch(summaryUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; portfolio-app/1.0)', Accept: 'application/json' } }),
    ])

    const chart = await chartRes.json()
    const summary = summaryRes.ok ? await summaryRes.json() : null

    const meta = chart?.chart?.result?.[0]?.meta ?? {}
    const detail = summary?.quoteSummary?.result?.[0]?.summaryDetail ?? {}
    const keyStats = summary?.quoteSummary?.result?.[0]?.defaultKeyStatistics ?? {}
    const profile = summary?.quoteSummary?.result?.[0]?.assetProfile ?? {}

    const price = meta.regularMarketPrice ?? null
    const annualDividend = detail.dividendRate?.raw ?? null
    const yieldPct = detail.dividendYield?.raw ? detail.dividendYield.raw * 100 : null
    const exDividendDate = detail.exDividendDate?.raw
      ? new Date(detail.exDividendDate.raw * 1000).toISOString().slice(0, 10)
      : null
    const dividendDate = detail.dividendDate?.raw
      ? new Date(detail.dividendDate.raw * 1000).toISOString().slice(0, 10)
      : null
    const trailingAnnualDividend = detail.trailingAnnualDividendRate?.raw ?? null
    const trailingYield = detail.trailingAnnualDividendYield?.raw
      ? detail.trailingAnnualDividendYield.raw * 100
      : null
    const payoutRatio = detail.payoutRatio?.raw ? detail.payoutRatio.raw * 100 : null
    const fiveYearAvgYield = detail.fiveYearAvgDividendYield?.raw ?? null
    const currency = meta.currency ?? 'EUR'
    const shortName = meta.shortName ?? ticker
    const sector = profile.sector ?? ''
    const industry = profile.industry ?? ''
    const consecutiveYears = keyStats.lastDividendDate?.raw
      ? Math.floor((Date.now() / 1000 - keyStats.lastDividendDate.raw) / (86400 * 365))
      : null

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    return res.status(200).json({
      ticker,
      name: shortName,
      price,
      currency,
      sector,
      industry,
      annualDividend,
      trailingAnnualDividend,
      yieldPct,
      trailingYield,
      exDividendDate,
      dividendDate,
      payoutRatio,
      fiveYearAvgYield,
      consecutiveYears,
    })
  } catch (err) {
    return res.status(500).json({ error: 'Internal error', detail: err.message })
  }
}

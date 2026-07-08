// Proxy Yahoo Finance quoteSummary to get real fundamental metrics
// (valuation, profitability, growth, financial health, analyst targets).
// GET /api/fundamentals?ticker=BNP.PA
const MODULES = 'summaryDetail,defaultKeyStatistics,financialData,price'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const ticker = req.query?.ticker?.trim()
  if (!ticker) return res.status(400).json({ error: 'Missing ticker' })

  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${MODULES}`

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; portfolio-app/1.0)', Accept: 'application/json' },
    })
    if (!upstream.ok) return res.status(upstream.status).json({ error: 'Yahoo Finance error', status: upstream.status })

    const data = await upstream.json()
    const result = data?.quoteSummary?.result?.[0]
    if (!result) return res.status(404).json({ error: 'No data' })

    const sd = result.summaryDetail ?? {}
    const ks = result.defaultKeyStatistics ?? {}
    const fd = result.financialData ?? {}
    const pr = result.price ?? {}

    const raw = (m) => (m && typeof m.raw === 'number' ? m.raw : null)
    const pct = (m) => { const v = raw(m); return v == null ? null : v * 100 }

    const currentPrice = raw(fd.currentPrice) ?? raw(pr.regularMarketPrice)
    const eps = raw(ks.trailingEps)
    const bookValue = raw(ks.bookValue)
    const grahamValue = eps != null && bookValue != null && eps > 0 && bookValue > 0
      ? Math.sqrt(22.5 * eps * bookValue)
      : null

    // Simplified 10-year DCF from real FCF/share, using consensus-ish
    // constants (5% growth, 9% discount) — a real calculation, not a fake number.
    const freeCashflow = raw(fd.freeCashflow)
    const sharesOutstanding = raw(ks.sharesOutstanding)
    let dcfValue = null
    if (freeCashflow != null && sharesOutstanding && sharesOutstanding > 0) {
      const fcfPerShare = freeCashflow / sharesOutstanding
      if (fcfPerShare > 0) {
        const growth = 0.05, discount = 0.09, terminalGrowth = 0.025
        let pv = 0
        let fcf = fcfPerShare
        for (let y = 1; y <= 10; y++) {
          fcf *= (1 + growth)
          pv += fcf / Math.pow(1 + discount, y)
        }
        const terminal = (fcf * (1 + terminalGrowth)) / (discount - terminalGrowth)
        pv += terminal / Math.pow(1 + discount, 10)
        dcfValue = pv
      }
    }

    const analystTarget = raw(fd.targetMeanPrice)
    const analystUpside = analystTarget != null && currentPrice ? ((analystTarget - currentPrice) / currentPrice) * 100 : null

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    return res.status(200).json({
      ticker,
      currentPrice,
      marketCap: raw(pr.marketCap),
      pe: raw(sd.trailingPE),
      forwardPE: raw(sd.forwardPE) ?? raw(ks.forwardPE),
      pb: raw(ks.priceToBook),
      ps: raw(sd.priceToSalesTrailing12Months),
      ev_ebitda: raw(ks.enterpriseToEbitda),
      roe: pct(fd.returnOnEquity),
      roa: pct(fd.returnOnAssets),
      grossMargin: pct(fd.grossMargins),
      operatingMargin: pct(fd.operatingMargins),
      netMargin: pct(fd.profitMargins) ?? pct(ks.profitMargins),
      revenueGrowthYoY: pct(fd.revenueGrowth),
      epsGrowthYoY: pct(fd.earningsGrowth),
      debtToEquity: raw(fd.debtToEquity) != null ? raw(fd.debtToEquity) / 100 : null,
      currentRatio: raw(fd.currentRatio),
      dividendYield: pct(sd.dividendYield),
      payoutRatio: pct(sd.payoutRatio),
      analystTarget,
      analystUpside,
      numAnalysts: raw(fd.numberOfAnalystOpinions),
      grahamValue,
      dcfValue,
    })
  } catch (err) {
    return res.status(500).json({ error: 'Internal error', detail: err.message })
  }
}

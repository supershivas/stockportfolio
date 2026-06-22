const HOSTS = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']

export default async function handler(req, res) {
  const { ticker } = req.query
  if (!ticker) return res.status(400).json({ error: 'ticker required' })

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://finance.yahoo.com/',
    'Origin': 'https://finance.yahoo.com',
  }

  for (const host of HOSTS) {
    try {
      const url = `https://${host}/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`
      const upstream = await fetch(url, { headers })
      if (!upstream.ok) continue
      const data = await upstream.json()
      if (!data?.chart?.result?.[0]?.meta?.regularMarketPrice) continue
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
      return res.json(data)
    } catch { /* try next host */ }
  }

  // Last resort: try v10 endpoint (different path, sometimes works when v8 is blocked)
  try {
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=price`
    const upstream = await fetch(url, { headers })
    if (upstream.ok) {
      const data = await upstream.json()
      const price = data?.quoteSummary?.result?.[0]?.price
      if (price?.regularMarketPrice?.raw) {
        const p = price.regularMarketPrice.raw
        const prev = price.regularMarketPreviousClose?.raw ?? p
        const synth = {
          chart: {
            result: [{
              meta: {
                regularMarketPrice: p,
                chartPreviousClose: prev,
                regularMarketDayHigh: price.regularMarketDayHigh?.raw ?? p,
                regularMarketDayLow: price.regularMarketDayLow?.raw ?? p,
                regularMarketOpen: price.regularMarketOpen?.raw ?? p,
              }
            }],
            error: null,
          }
        }
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
        return res.json(synth)
      }
    }
  } catch { /* fall through */ }

  return res.status(502).json({ error: 'upstream unavailable' })
}

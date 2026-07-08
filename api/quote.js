const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const HOSTS = ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com']

export default async function handler(req, res) {
  const { ticker, range, interval } = req.query
  if (!ticker) return res.status(400).json({ error: 'ticker required' })

  const headers = {
    'User-Agent': UA,
    'Accept': 'application/json',
    'Referer': 'https://finance.yahoo.com/',
  }

  for (const host of HOSTS) {
    try {
      const url = `${host}/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval || '1d'}&range=${range || '1d'}`
      const r = await fetch(url, { headers })
      if (!r.ok) continue
      const data = await r.json()
      if (!data?.chart?.result?.[0]?.meta?.regularMarketPrice) continue
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
      return res.json(data)
    } catch { /* try next */ }
  }

  return res.status(502).json({ error: 'upstream unavailable' })
}

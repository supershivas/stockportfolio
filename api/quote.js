// Yahoo Finance blocks datacenter IPs (Vercel/AWS) unless requests include a valid cookie+crumb.
// We use Node's native https module because undici (used by global fetch) overflows on Yahoo's
// large Set-Cookie headers when fetching the homepage.
import https from 'https'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// In-memory cache shared across warm serverless invocations
let _cookie = null
let _crumb = null
let _cacheTs = 0
const TTL = 50 * 60 * 1000 // 50 min

function httpsGet(hostname, path, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, headers, maxHeaderSize: 65536 }, (res) => {
      let body = ''
      res.on('data', (d) => (body += d))
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }))
    })
    req.on('error', reject)
    req.end()
  })
}

async function refreshCrumb() {
  // Fetch /quote/AAPL/ — lighter page, only 3 cookies (vs 20+ on homepage)
  const r1 = await httpsGet('finance.yahoo.com', '/quote/AAPL/', { 'User-Agent': UA, 'Accept': 'text/html' })
  const cookies = (r1.headers['set-cookie'] ?? [])
  const a1 = cookies.find((c) => c.startsWith('A1='))?.split(';')[0]
  if (!a1) throw new Error('No A1 cookie from Yahoo')

  const r2 = await httpsGet('query2.finance.yahoo.com', '/v1/test/getcrumb', { 'User-Agent': UA, 'Cookie': a1 })
  const crumb = r2.body?.trim()
  if (!crumb || crumb.includes('"error"')) throw new Error(`Bad crumb: ${crumb}`)

  _cookie = a1
  _crumb = crumb
  _cacheTs = Date.now()
  return { cookie: a1, crumb }
}

async function getCrumb() {
  if (_cookie && _crumb && Date.now() - _cacheTs < TTL) return { cookie: _cookie, crumb: _crumb }
  return refreshCrumb()
}

async function fetchQuote(ticker, cookie, crumb) {
  const hosts = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']
  for (const host of hosts) {
    const path = `/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d&crumb=${encodeURIComponent(crumb)}`
    const r = await httpsGet(host, path, { 'User-Agent': UA, 'Cookie': cookie, 'Accept': 'application/json', 'Referer': 'https://finance.yahoo.com/' })
    if (r.status !== 200) continue
    const data = JSON.parse(r.body)
    if (data?.chart?.result?.[0]?.meta?.regularMarketPrice) return data
  }
  return null
}

export default async function handler(req, res) {
  const { ticker } = req.query
  if (!ticker) return res.status(400).json({ error: 'ticker required' })

  try {
    let { cookie, crumb } = await getCrumb()
    let data = await fetchQuote(ticker, cookie, crumb)

    // Crumb may be stale — refresh once and retry
    if (!data) {
      ;({ cookie, crumb } = await refreshCrumb())
      data = await fetchQuote(ticker, cookie, crumb)
    }

    if (!data) return res.status(502).json({ error: 'upstream unavailable' })

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res.json(data)
  } catch (e) {
    return res.status(500).json({ error: String(e) })
  }
}

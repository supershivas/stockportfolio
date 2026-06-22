import https from 'https'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function httpsGet(hostname, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, headers: { 'User-Agent': UA, ...headers }, maxHeaderSize: 65536 }, (res) => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }))
    })
    req.on('error', reject)
    req.end()
  })
}

export default async function handler(req, res) {
  const steps = []

  // Test 1: fetch() API (used by quote.js)
  try {
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/DCAM.PA?interval=1d&range=1d', {
      headers: { 'User-Agent': UA, 'Accept': 'application/json', 'Referer': 'https://finance.yahoo.com/' }
    })
    let price = null, parseErr = null, bodyStart = ''
    try {
      const text = await r.text()
      bodyStart = text.substring(0, 150)
      price = JSON.parse(text)?.chart?.result?.[0]?.meta?.regularMarketPrice
    } catch (e) { parseErr = String(e) }
    steps.push({ step: '1_fetch_api', status: r.status, ok: r.ok, price, parseErr, bodyStart })
  } catch (e) {
    steps.push({ step: '1_fetch_api', error: String(e) })
  }

  // Test 2: fetch() query2
  try {
    const r = await fetch('https://query2.finance.yahoo.com/v8/finance/chart/DCAM.PA?interval=1d&range=1d', {
      headers: { 'User-Agent': UA, 'Accept': 'application/json' }
    })
    let price = null
    try { price = (await r.json())?.chart?.result?.[0]?.meta?.regularMarketPrice } catch {}
    steps.push({ step: '2_fetch_query2', status: r.status, price })
  } catch (e) {
    steps.push({ step: '2_fetch_query2', error: String(e) })
  }

  // Test 3: https module (confirmed working)
  try {
    const r = await httpsGet('query1.finance.yahoo.com', '/v8/finance/chart/DCAM.PA?interval=1d&range=1d', { 'Accept': 'application/json' })
    let price = null
    try { price = JSON.parse(r.body)?.chart?.result?.[0]?.meta?.regularMarketPrice } catch {}
    steps.push({ step: '3_https_module', status: r.status, price })
  } catch (e) {
    steps.push({ step: '3_https_module', error: String(e) })
  }

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.json({ steps, nodeVersion: process.version })
}

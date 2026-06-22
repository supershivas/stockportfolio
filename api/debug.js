import https from 'https'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function httpsGet(hostname, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, headers: { 'User-Agent': UA, ...headers }, maxHeaderSize: 65536 }, (res) => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => resolve({ status: res.statusCode, cookies: res.headers['set-cookie'] ?? [], body }))
    })
    req.on('error', reject)
    req.end()
  })
}

export default async function handler(req, res) {
  const steps = []

  // Step 1: direct fetch without cookie
  try {
    const r = await httpsGet('query1.finance.yahoo.com', '/v8/finance/chart/AAPL?interval=1d&range=1d', { 'Accept': 'application/json' })
    let price = null
    try { price = JSON.parse(r.body)?.chart?.result?.[0]?.meta?.regularMarketPrice } catch {}
    steps.push({ step: '1_direct_no_cookie', status: r.status, price, bodyStart: r.body.substring(0, 120) })
  } catch (e) {
    steps.push({ step: '1_direct_no_cookie', error: String(e) })
  }

  // Step 2: get cookie
  let a1 = null
  try {
    const r = await httpsGet('finance.yahoo.com', '/quote/AAPL/', { 'Accept': 'text/html' })
    a1 = r.cookies.find(c => c.startsWith('A1='))?.split(';')[0] ?? null
    steps.push({ step: '2_get_cookie', status: r.status, a1_found: !!a1, nb_cookies: r.cookies.length })
  } catch (e) {
    steps.push({ step: '2_get_cookie', error: String(e) })
  }

  // Step 3: get crumb
  let crumb = null
  if (a1) {
    try {
      const r = await httpsGet('query2.finance.yahoo.com', '/v1/test/getcrumb', { 'Cookie': a1 })
      crumb = r.body?.trim()
      steps.push({ step: '3_get_crumb', status: r.status, crumb, ok: !!crumb && !crumb.includes('error') })
    } catch (e) {
      steps.push({ step: '3_get_crumb', error: String(e) })
    }
  }

  // Step 4: fetch DCAM.PA with cookie+crumb
  if (a1 && crumb && !crumb.includes('error')) {
    try {
      const path = `/v8/finance/chart/DCAM.PA?interval=1d&range=1d&crumb=${encodeURIComponent(crumb)}`
      const r = await httpsGet('query1.finance.yahoo.com', path, { 'Cookie': a1, 'Accept': 'application/json' })
      let price = null
      let parseErr = null
      try { price = JSON.parse(r.body)?.chart?.result?.[0]?.meta?.regularMarketPrice } catch (e) { parseErr = String(e) }
      steps.push({ step: '4_with_cookie_crumb', status: r.status, price, parseErr, bodyStart: r.body.substring(0, 120) })
    } catch (e) {
      steps.push({ step: '4_with_cookie_crumb', error: String(e) })
    }
  }

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.json({ steps, nodeVersion: process.version, region: process.env.VERCEL_REGION ?? 'unknown' })
}

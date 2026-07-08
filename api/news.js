// Proxy Yahoo Finance's free RSS feed to avoid CORS from the browser.
// No API key required. GET /api/news
const FEED_URL = 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=%5EGSPC,%5EIXIC,%5EFCHI,%5EVIX,GC=F&region=US&lang=en-US'

function extractTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))
  if (!m) return ''
  return m[1].replace('<![CDATA[', '').replace(']]>', '').trim()
}

function parseItems(xml) {
  const items = []
  const chunks = xml.split('<item>').slice(1)
  for (const chunk of chunks) {
    const title = extractTag(chunk, 'title')
    const link = extractTag(chunk, 'link')
    const pubDate = extractTag(chunk, 'pubDate')
    const description = extractTag(chunk, 'description')
    const guid = extractTag(chunk, 'guid')
    if (!title || !link) continue
    items.push({
      id: guid || link,
      headline: title,
      summary: description.replace(/<[^>]+>/g, '').slice(0, 200),
      source: 'Yahoo Finance',
      url: link,
      datetime: pubDate ? Math.floor(new Date(pubDate).getTime() / 1000) : Math.floor(Date.now() / 1000),
    })
  }
  return items
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const upstream = await fetch(FEED_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; portfolio-app/1.0)' },
    })
    if (!upstream.ok) return res.status(upstream.status).json({ error: 'Yahoo Finance RSS error' })
    const xml = await upstream.text()
    const items = parseItems(xml).slice(0, 8)
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900')
    return res.status(200).json({ items })
  } catch (err) {
    return res.status(500).json({ error: 'Internal error', detail: err.message })
  }
}

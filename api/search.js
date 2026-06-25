// Proxy Yahoo Finance search to avoid CORS issues from the browser.
// GET /api/search?q=apple&lang=fr-FR
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const q = req.query?.q?.trim()
  if (!q || q.length < 1) {
    return res.status(400).json({ error: 'Missing query param q' })
  }

  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&lang=fr-FR&region=FR&quotesCount=10&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; portfolio-app/1.0)',
        'Accept': 'application/json',
      },
    })

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Yahoo Finance error', status: upstream.status })
    }

    const data = await upstream.json()
    const quotes = (data?.quotes ?? []).filter(q => q.symbol && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'MUTUALFUND'))

    const results = quotes.map(q => ({
      ticker: q.symbol,
      name: q.longname || q.shortname || q.symbol,
      type: q.quoteType === 'ETF' ? 'ETF' : 'Action',
      exchange: q.exchDisp || q.exchange || '',
      country: q.exchange ? exchangeToFlag(q.exchange) : '',
      currency: q.currency || '',
    }))

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res.status(200).json({ results })
  } catch (err) {
    return res.status(500).json({ error: 'Internal error', detail: err.message })
  }
}

function exchangeToFlag(exchange) {
  const map = {
    // Euronext
    PAR: '🇫🇷', EPA: '🇫🇷',
    AMS: '🇳🇱', EAM: '🇳🇱',
    BRU: '🇧🇪',
    LIS: '🇵🇹',
    // Autres EU
    FRA: '🇩🇪', GER: '🇩🇪', ETR: '🇩🇪', XETRA: '🇩🇪',
    MIL: '🇮🇹', BIT: '🇮🇹',
    MCE: '🇪🇸', BME: '🇪🇸',
    STO: '🇸🇪',
    CPH: '🇩🇰',
    HEL: '🇫🇮',
    OSL: '🇳🇴',
    // Anglosaxon
    NMS: '🇺🇸', NYQ: '🇺🇸', NGM: '🇺🇸', PCX: '🇺🇸',
    LSE: '🇬🇧',
    TSX: '🇨🇦',
    ASX: '🇦🇺',
    // Asie
    TYO: '🇯🇵', JPX: '🇯🇵',
    HKG: '🇭🇰',
    SHH: '🇨🇳', SHZ: '🇨🇳',
    NSI: '🇮🇳', BSE: '🇮🇳',
  }
  return map[exchange] ?? '🌐'
}

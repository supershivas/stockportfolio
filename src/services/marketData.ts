// Finnhub free tier: 60 req/min = 1 req/s — https://finnhub.io
const FINNHUB_BASE = 'https://finnhub.io/api/v1'

// Yahoo Finance — routed via /api/quote (Vercel serverless proxy) to avoid CORS
async function fetchYahooQuote(ticker: string): Promise<QuoteResult | null> {
  try {
    const url = `/api/quote?ticker=${encodeURIComponent(ticker)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    const meta = json?.chart?.result?.[0]?.meta
    if (!meta?.regularMarketPrice) return null
    const price = meta.regularMarketPrice
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price
    const change = price - prevClose
    const changePercent = prevClose ? (change / prevClose) * 100 : 0
    return {
      ticker,
      price,
      change,
      changePercent,
      high: meta.regularMarketDayHigh ?? price,
      low: meta.regularMarketDayLow ?? price,
      open: meta.regularMarketOpen ?? price,
      prevClose,
      live: true,
    }
  } catch {
    return null
  }
}

// Safe delay: 1100ms between calls → ~54 req/min, comfortably under the 60/min limit
const RATE_LIMIT_DELAY_MS = 1100

export interface QuoteResult {
  ticker: string
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  open: number
  prevClose: number
  live: boolean // true = from API, false = fallback
}

function getKey(): string {
  return localStorage.getItem('finnhub_api_key') || ''
}

export function isApiConfigured(): boolean {
  return getKey().length > 0
}

export async function fetchQuote(ticker: string): Promise<QuoteResult | null> {
  const key = getKey()

  // Try Finnhub first if API key is configured
  if (key) {
    try {
      const res = await fetch(`${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(ticker)}&token=${key}`)
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 5000))
        const retry = await fetch(`${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(ticker)}&token=${key}`)
        if (retry.ok) {
          const d2 = await retry.json()
          if (d2.c && d2.c !== 0)
            return { ticker, price: d2.c, change: d2.d ?? 0, changePercent: d2.dp ?? 0, high: d2.h, low: d2.l, open: d2.o, prevClose: d2.pc, live: true }
        }
      } else if (res.ok) {
        const d = await res.json()
        if (d.c && d.c !== 0)
          return { ticker, price: d.c, change: d.d ?? 0, changePercent: d.dp ?? 0, high: d.h, low: d.l, open: d.o, prevClose: d.pc, live: true }
      }
    } catch { /* fall through to Yahoo */ }
  }

  // Fallback: Yahoo Finance (free, no key, covers Euronext ETFs like CW8.PA, PE500.PA)
  return fetchYahooQuote(ticker)
}

export async function fetchMultipleQuotes(tickers: string[]): Promise<Map<string, QuoteResult>> {
  const results = new Map<string, QuoteResult>()
  for (const ticker of tickers) {
    const q = await fetchQuote(ticker)
    if (q) results.set(ticker, q)
    await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY_MS))
  }
  return results
}

// EUR/USD via OANDA on Finnhub (free tier supports forex via OANDA feed)
// Falls back to a cached value in localStorage updated at most once per day
export async function fetchEurUsdRate(): Promise<number> {
  const CACHE_KEY = 'eurusd_rate_cache'
  const CACHE_TS_KEY = 'eurusd_rate_ts'
  const FALLBACK = 1.08

  // Use cached value if < 6 hours old
  const cached = localStorage.getItem(CACHE_KEY)
  const ts = parseInt(localStorage.getItem(CACHE_TS_KEY) || '0')
  if (cached && Date.now() - ts < 6 * 60 * 60 * 1000) {
    return parseFloat(cached)
  }

  const key = getKey()
  if (!key) return cached ? parseFloat(cached) : FALLBACK

  // Try OANDA:EUR_USD (Finnhub forex feed, free tier)
  try {
    const res = await fetch(`${FINNHUB_BASE}/quote?symbol=OANDA:EUR_USD&token=${key}`)
    if (res.ok) {
      const d = await res.json()
      if (d.c && d.c > 0) {
        localStorage.setItem(CACHE_KEY, d.c.toString())
        localStorage.setItem(CACHE_TS_KEY, Date.now().toString())
        return d.c
      }
    }
  } catch { /* continue to fallback */ }

  // Try Yahoo Finance for EUR/USD as last resort
  try {
    const y = await fetchYahooQuote('EURUSD=X')
    if (y && y.price > 0) {
      localStorage.setItem(CACHE_KEY, y.price.toString())
      localStorage.setItem(CACHE_TS_KEY, Date.now().toString())
      return y.price
    }
  } catch { /* ignore */ }

  return cached ? parseFloat(cached) : FALLBACK
}

// Index fallbacks updated June 2026
export const INDEX_TICKERS: { symbol: string; label: string; fallback: number; changePercent: number }[] = [
  { symbol: '^GSPC',   label: 'S&P 500',    fallback: 5850,  changePercent: 0.31 },
  { symbol: '^IXIC',   label: 'NASDAQ',     fallback: 18900, changePercent: 0.54 },
  { symbol: '^FCHI',   label: 'CAC 40',     fallback: 7950,  changePercent: -0.12 },
  { symbol: 'IWDA.AS', label: 'MSCI World', fallback: 102.4, changePercent: 0.28 },
]

// Key market indicators — DX=F is the Finnhub-compatible Dollar Index futures symbol
export const INDICATOR_TICKERS = [
  { symbol: '^VIX', label: 'VIX' },
  { symbol: 'GC=F', label: 'Or (Gold)' },
  { symbol: 'DX=F', label: 'Dollar Index' },
]

export async function testApiKey(key: string): Promise<boolean> {
  try {
    const res = await fetch(`${FINNHUB_BASE}/quote?symbol=AAPL&token=${key}`)
    if (!res.ok) return false
    const d = await res.json()
    return d.c > 0
  } catch {
    return false
  }
}

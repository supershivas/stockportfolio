// Finnhub free tier: 60 req/min. Get a key at https://finnhub.io
const FINNHUB_BASE = 'https://finnhub.io/api/v1'

export interface QuoteResult {
  ticker: string
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  open: number
  prevClose: number
}

export interface ApiStatus {
  configured: boolean
  lastError: string | null
}

function getKey(): string {
  return localStorage.getItem('finnhub_api_key') || ''
}

export function isApiConfigured(): boolean {
  return getKey().length > 0
}

export async function fetchQuote(ticker: string): Promise<QuoteResult | null> {
  const key = getKey()
  if (!key) return null
  try {
    // Finnhub uses base tickers without exchange suffixes for US stocks
    // For European: MC.PA → MC, BNP.PA → BNP — we strip the exchange suffix for Finnhub
    const sym = ticker.replace(/\.(PA|DE|AS)$/, '')
    const res = await fetch(`${FINNHUB_BASE}/quote?symbol=${sym}&token=${key}`)
    if (!res.ok) return null
    const d = await res.json()
    if (!d.c || d.c === 0) return null
    return {
      ticker,
      price: d.c,
      change: d.d,
      changePercent: d.dp,
      high: d.h,
      low: d.l,
      open: d.o,
      prevClose: d.pc,
    }
  } catch {
    return null
  }
}

export async function fetchMultipleQuotes(tickers: string[]): Promise<Map<string, QuoteResult>> {
  const results = new Map<string, QuoteResult>()
  // Batch with small delay to respect rate limit
  for (const ticker of tickers) {
    const q = await fetchQuote(ticker)
    if (q) results.set(ticker, q)
    await new Promise((r) => setTimeout(r, 120)) // ~8 req/s well within 60/min
  }
  return results
}

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

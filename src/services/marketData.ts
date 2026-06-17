// Finnhub free tier: 60 req/min — https://finnhub.io
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

// Finnhub symbol mapping for European exchanges
// Finnhub uses exchange-prefixed symbols: "MC.PA" → "MC.PA" for Euronext Paris actually works
// but for some it needs the full ISIN-style; safest: try with suffix first, then without
function toFinnhubSymbol(ticker: string): string {
  // Finnhub accepts Euronext-style tickers directly (MC.PA, SAN.PA, etc.)
  return ticker
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
    const sym = toFinnhubSymbol(ticker)
    const res = await fetch(`${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(sym)}&token=${key}`)
    if (!res.ok) return null
    const d = await res.json()
    if (!d.c || d.c === 0) return null
    return { ticker, price: d.c, change: d.d ?? 0, changePercent: d.dp ?? 0, high: d.h, low: d.l, open: d.o, prevClose: d.pc }
  } catch {
    return null
  }
}

export async function fetchMultipleQuotes(tickers: string[]): Promise<Map<string, QuoteResult>> {
  const results = new Map<string, QuoteResult>()
  for (const ticker of tickers) {
    const q = await fetchQuote(ticker)
    if (q) results.set(ticker, q)
    await new Promise((r) => setTimeout(r, 130)) // ~7 req/s, well within 60/min
  }
  return results
}

// Fetch major index quotes for Dashboard
// Finnhub index symbols: ^GSPC = S&P500, ^IXIC = NASDAQ, ^FCHI = CAC40
export const INDEX_TICKERS: { symbol: string; label: string; fallback: number; changePercent: number }[] = [
  { symbol: '^GSPC',  label: 'S&P 500',    fallback: 5234, changePercent: 0.42 },
  { symbol: '^IXIC',  label: 'NASDAQ',     fallback: 16424, changePercent: 0.61 },
  { symbol: '^FCHI',  label: 'CAC 40',     fallback: 8088, changePercent: -0.18 },
  { symbol: 'IWDA.AS', label: 'MSCI World', fallback: 88.4, changePercent: 0.35 },
]

// Fetch a few key indicators for the Indicators page
export const INDICATOR_TICKERS = [
  { symbol: '^VIX',   label: 'VIX' },
  { symbol: 'GC=F',   label: 'Or (Gold)' },
  { symbol: 'DX-Y.NYB', label: 'Dollar Index' },
]

export async function fetchEurUsdRate(): Promise<number> {
  const key = getKey()
  if (!key) return 1.08 // fallback
  try {
    const res = await fetch(`${FINNHUB_BASE}/quote?symbol=EURUSD&token=${key}`)
    if (!res.ok) return 1.08
    const d = await res.json()
    return d.c && d.c > 0 ? d.c : 1.08
  } catch {
    return 1.08
  }
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

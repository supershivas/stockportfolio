export interface PricePoint {
  ts: number   // unix ms
  price: number
}

const MAX_POINTS = 90 // ~3 months of daily snapshots

function key(ticker: string) {
  return `ph_${ticker}`
}

export function getHistory(ticker: string): PricePoint[] {
  try {
    const raw = localStorage.getItem(key(ticker))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function appendPrice(ticker: string, price: number) {
  try {
    const history = getHistory(ticker)
    const now = Date.now()
    // Avoid duplicate entries on the same calendar day
    const todayStart = new Date().setHours(0, 0, 0, 0)
    const filtered = history.filter((p) => p.ts < todayStart)
    const updated = [...filtered, { ts: now, price }].slice(-MAX_POINTS)
    localStorage.setItem(key(ticker), JSON.stringify(updated))
  } catch { /* quota */ }
}

export function clearHistory(ticker: string) {
  localStorage.removeItem(key(ticker))
}

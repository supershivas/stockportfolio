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
    const todayStart = new Date().setHours(0, 0, 0, 0)
    // Until we have a curve (2+ points), allow 2 saves per day so the chart
    // can appear after a single session. Once the history is established,
    // keep one point per day to avoid noise.
    let filtered: PricePoint[]
    if (history.length < 2) {
      // Allow at most 2 entries today
      const todayEntries = history.filter((p) => p.ts >= todayStart)
      if (todayEntries.length >= 2) return
      filtered = history
    } else {
      filtered = history.filter((p) => p.ts < todayStart)
    }
    const updated = [...filtered, { ts: now, price }].slice(-MAX_POINTS)
    localStorage.setItem(key(ticker), JSON.stringify(updated))
  } catch { /* quota */ }
}

export function clearHistory(ticker: string) {
  localStorage.removeItem(key(ticker))
}

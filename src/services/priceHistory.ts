export interface PricePoint {
  ts: number   // unix ms
  price: number
}

const MAX_POINTS = 10_000 // ~27 years of daily data — effectively unlimited

function key(ticker: string) {
  return `ph_${ticker}`
}

export function getHistory(ticker: string): PricePoint[] {
  try {
    const raw = localStorage.getItem(key(ticker))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function getAllHistory(): Record<string, PricePoint[]> {
  const result: Record<string, PricePoint[]> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k?.startsWith('ph_')) continue
    const ticker = k.slice(3)
    try {
      const raw = localStorage.getItem(k)
      if (raw) result[ticker] = JSON.parse(raw)
    } catch { /* skip */ }
  }
  return result
}

export function restoreAllHistory(data: Record<string, PricePoint[]>) {
  for (const [ticker, points] of Object.entries(data)) {
    if (Array.isArray(points) && points.length > 0) {
      localStorage.setItem(key(ticker), JSON.stringify(points))
    }
  }
}

export function appendPrice(ticker: string, price: number) {
  try {
    const history = getHistory(ticker)
    const now = Date.now()
    const todayStart = new Date().setHours(0, 0, 0, 0)
    let filtered: PricePoint[]
    if (history.length < 2) {
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

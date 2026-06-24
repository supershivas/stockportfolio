import { Position } from '../types'
import { getAllHistory, restoreAllHistory, PricePoint } from './priceHistory'

let syncTimer: ReturnType<typeof setTimeout> | null = null

export function isCloudConfigured(): boolean {
  return true
}

export async function syncToCloud(positions: Position[]): Promise<void> {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    try {
      const priceHistory = getAllHistory()
      await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions, priceHistory }),
      })
    } catch { /* silent */ }
  }, 3000)
}

export interface CloudData {
  positions: Position[]
  priceHistory?: Record<string, PricePoint[]>
}

export async function restoreFromCloud(): Promise<CloudData | null> {
  try {
    const res = await fetch('/api/portfolio')
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data?.positions)) return null
    if (data.priceHistory) restoreAllHistory(data.priceHistory)
    return { positions: data.positions, priceHistory: data.priceHistory }
  } catch {
    return null
  }
}

export function getBackupId(): string | null { return 'github' }

import { Position, Transaction } from '../types'
import { getAllHistory, restoreAllHistory, PricePoint } from './priceHistory'

let syncTimer: ReturnType<typeof setTimeout> | null = null

const LAST_SYNCED_KEY = 'portfolio_last_synced_at'

export function isCloudConfigured(): boolean {
  return true
}

export function getLastSyncedAt(): number {
  return parseInt(localStorage.getItem(LAST_SYNCED_KEY) || '0', 10)
}

export function setLastSyncedAt(ts: number): void {
  localStorage.setItem(LAST_SYNCED_KEY, String(ts))
}

export async function syncToCloud(positions: Position[], transactions: Transaction[] = []): Promise<void> {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    try {
      const priceHistory = getAllHistory()
      const now = Date.now()
      await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions, priceHistory, transactions }),
      })
      // Record locally so a later reload on this device knows its data is
      // at least this fresh, and won't be needlessly clobbered by the cloud.
      setLastSyncedAt(now)
    } catch { /* silent */ }
  }, 3000)
}

export interface CloudData {
  positions: Position[]
  priceHistory?: Record<string, PricePoint[]>
  transactions?: Transaction[]
  updatedAt?: number
}

export async function restoreFromCloud(): Promise<CloudData | null> {
  try {
    const res = await fetch('/api/portfolio')
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data?.positions)) return null
    if (data.priceHistory) restoreAllHistory(data.priceHistory)
    return {
      positions: data.positions,
      priceHistory: data.priceHistory,
      transactions: data.transactions ?? [],
      updatedAt: data.updatedAt,
    }
  } catch {
    return null
  }
}

export function getBackupId(): string | null { return 'github' }

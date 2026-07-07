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

function mergeTransactions(cloud: Transaction[], local: Transaction[]): Transaction[] {
  const byId = new Map<string, Transaction>()
  cloud.forEach((t) => byId.set(t.id, t))
  local.forEach((t) => byId.set(t.id, t))
  return Array.from(byId.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// Transactions are an append-only log, not a point-in-time snapshot like
// positions — two devices can each record a new transaction between one
// hydrate and the next. A blind overwrite would let whichever device syncs
// last silently erase the other's entries. So on every push, pull the
// current cloud transactions and merge (union by id) before writing back.
export async function syncToCloud(
  positions: Position[],
  transactions: Transaction[] = [],
  onMergedTransactions?: (merged: Transaction[]) => void,
): Promise<void> {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    try {
      let merged = transactions
      try {
        const res = await fetch('/api/portfolio')
        if (res.ok) {
          const cloud = await res.json()
          if (Array.isArray(cloud?.transactions) && cloud.transactions.length > 0) {
            merged = mergeTransactions(cloud.transactions, transactions)
          }
        }
      } catch { /* fall back to pushing local transactions as-is */ }

      const priceHistory = getAllHistory()
      const now = Date.now()
      await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions, priceHistory, transactions: merged }),
      })
      // Record locally so a later reload on this device knows its data is
      // at least this fresh, and won't be needlessly clobbered by the cloud.
      setLastSyncedAt(now)
      if (merged.length !== transactions.length) onMergedTransactions?.(merged)
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

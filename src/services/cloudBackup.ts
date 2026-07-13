import { Position, Transaction } from '../types'
import { getAllHistory, restoreAllHistory, PricePoint } from './priceHistory'

let syncTimer: ReturnType<typeof setTimeout> | null = null

const LAST_SYNCED_KEY = 'portfolio_last_synced_at'
const TX_LKG_KEY = 'portfolio_tx_last_known_good'

export function isCloudConfigured(): boolean {
  return true
}

export function getLastSyncedAt(): number {
  return parseInt(localStorage.getItem(LAST_SYNCED_KEY) || '0', 10)
}

export function setLastSyncedAt(ts: number): void {
  localStorage.setItem(LAST_SYNCED_KEY, String(ts))
}

function getLastKnownGoodTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TX_LKG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function setLastKnownGoodTransactions(txs: Transaction[]): void {
  try { localStorage.setItem(TX_LKG_KEY, JSON.stringify(txs)) } catch { /* quota */ }
}

function mergeTransactions(...lists: Transaction[][]): Transaction[] {
  const byId = new Map<string, Transaction>()
  lists.forEach((list) => list.forEach((t) => byId.set(t.id, t)))
  return Array.from(byId.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

async function fetchCloudTransactions(): Promise<Transaction[] | null> {
  const res = await fetch('/api/portfolio')
  if (!res.ok) return null
  const cloud = await res.json()
  return Array.isArray(cloud?.transactions) ? cloud.transactions : null
}

// Transactions are an append-only log, not a point-in-time snapshot like
// positions — two devices can each record a new transaction between one
// hydrate and the next. A blind overwrite would let whichever device syncs
// last silently erase the other's entries. So on every push, pull the
// current cloud transactions and merge (union by id) before writing back.
//
// If that pull fails (flaky network, long-lived tab, etc.), we must NEVER
// fall back to pushing the bare local array — that previously caused real
// data loss: a failed merge fetch silently erased a week of transaction
// history. Instead we fall back to a locally-cached "last known good" set
// that only ever grows, and merge that in too, so a sync can add entries
// but can never make the total shrink.
export async function syncToCloud(
  positions: Position[],
  transactions: Transaction[] = [],
  onMergedTransactions?: (merged: Transaction[]) => void,
): Promise<void> {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    try {
      let cloudTx = await fetchCloudTransactions()
      if (cloudTx == null) {
        // Retry once after a short delay before falling back — most
        // failures here are transient network blips, not real outages.
        await new Promise((r) => setTimeout(r, 1500))
        cloudTx = await fetchCloudTransactions()
      }
      const lastKnownGood = getLastKnownGoodTransactions()
      const merged = cloudTx != null
        ? mergeTransactions(cloudTx, lastKnownGood, transactions)
        : mergeTransactions(lastKnownGood, transactions)

      const priceHistory = getAllHistory()
      const now = Date.now()
      await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions, priceHistory, transactions: merged }),
      })
      setLastKnownGoodTransactions(merged)
      // Record locally so a later reload on this device knows its data is
      // at least this fresh, and won't be needlessly clobbered by the cloud.
      setLastSyncedAt(now)
      if (merged.length !== transactions.length) onMergedTransactions?.(merged)
    } catch { /* silent — next mutation or periodic re-hydrate will retry */ }
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
    const transactions = data.transactions ?? []
    // Every successful cloud read is also an opportunity to refresh the
    // local safety net used by syncToCloud's fallback path.
    if (transactions.length > 0) {
      setLastKnownGoodTransactions(mergeTransactions(getLastKnownGoodTransactions(), transactions))
    }
    return {
      positions: data.positions,
      priceHistory: data.priceHistory,
      transactions,
      updatedAt: data.updatedAt,
    }
  } catch {
    return null
  }
}

export function getBackupId(): string | null { return 'github' }

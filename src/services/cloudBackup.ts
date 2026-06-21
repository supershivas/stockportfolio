import { Position } from '../types'

const JSONBIN_BASE = 'https://api.jsonbin.io/v3/b'
const BACKUP_ID_KEY = 'portfolio_backup_id'

export function getBackupId(): string | null {
  return localStorage.getItem(BACKUP_ID_KEY)
}

export async function syncToCloud(positions: Position[]): Promise<void> {
  try {
    const body = JSON.stringify({ positions })
    const existingId = getBackupId()

    if (!existingId) {
      // First backup — create a new bin
      const res = await fetch(JSONBIN_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bin-Name': 'PortfolioAI',
        },
        body,
      })
      if (!res.ok) return
      const data = await res.json()
      const id: string = data?.metadata?.id
      if (id) {
        localStorage.setItem(BACKUP_ID_KEY, id)
      }
    } else {
      // Subsequent saves — update existing bin
      await fetch(`${JSONBIN_BASE}/${existingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
    }
  } catch {
    // Silent failure — don't break the UI
  }
}

export async function restoreFromCloud(binId: string): Promise<Position[] | null> {
  try {
    const res = await fetch(`${JSONBIN_BASE}/${binId.trim()}/latest`)
    if (!res.ok) return null
    const data = await res.json()
    const positions: Position[] = data?.record?.positions
    if (Array.isArray(positions)) {
      localStorage.setItem(BACKUP_ID_KEY, binId.trim())
      return positions
    }
    return null
  } catch {
    return null
  }
}

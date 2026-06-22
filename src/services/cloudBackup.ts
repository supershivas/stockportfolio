import { Position } from '../types'

// Debounce helper
let syncTimer: ReturnType<typeof setTimeout> | null = null

export function isCloudConfigured(): boolean {
  // Cloud sync works via /api/portfolio (GitHub), available as long as GITHUB_TOKEN is set on Vercel
  return true
}

export async function syncToCloud(positions: Position[]): Promise<void> {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    try {
      await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions }),
      })
    } catch { /* silent */ }
  }, 3000)
}

export async function restoreFromCloud(): Promise<Position[] | null> {
  try {
    const res = await fetch('/api/portfolio')
    if (!res.ok) return null
    const data = await res.json()
    if (Array.isArray(data?.positions)) return data.positions
    return null
  } catch {
    return null
  }
}

// Legacy: kept for URL param restore (?b=ID) - no-op now
export function getBackupId(): string | null { return 'github' }

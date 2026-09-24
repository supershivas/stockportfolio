import { useEffect, useState } from 'react'
import { X, Download, Key } from 'lucide-react'
import { loadChangelog, downloadJSON, ChangelogEntry } from '../app-update.js'
import { usePortfolioStore } from '../store/portfolioStore'

const BASE = import.meta.env.BASE_URL

interface Props {
  version: string | null
  onClose: () => void
  onOpenMarketSettings: () => void
}

// Réglages (roue crantée) : données de marché, export JSON du portefeuille,
// version et 5 dernières versions (public/CHANGELOG.md).
export default function AppSettings({ version, onClose, onOpenMarketSettings }: Props) {
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])

  useEffect(() => {
    loadChangelog(`${BASE}CHANGELOG.md`).then(setChangelog)
  }, [])

  function exportData() {
    const { positions, transactions } = usePortfolioStore.getState()
    const now = new Date().toISOString()
    downloadJSON({ app: 'stockportfolio', version, exported_at: now, positions, transactions }, `stockportfolio_${now.slice(0, 10)}.json`)
  }

  const rowStyle = { background: 'var(--hover-bg)', color: 'var(--text-primary)' }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Réglages"
        className="rounded-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Réglages</h2>
          <button onClick={onClose} aria-label="Fermer" className="w-11 h-11 -mr-3 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2">
          <button onClick={onOpenMarketSettings} className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-left" style={rowStyle}>
            <Key size={16} style={{ color: 'var(--text-muted)' }} />
            Données de marché
          </button>
          <button onClick={exportData} className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-left" style={rowStyle}>
            <Download size={16} style={{ color: 'var(--text-muted)' }} />
            Exporter mes données (JSON)
          </button>
        </div>

        {version && <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Version {version}</p>}
        {changelog.length > 0 && (
          <details className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <summary className="cursor-pointer text-center py-2 select-none">Nouveautés</summary>
            <ol className="mt-2 space-y-3">
              {changelog.map(entry => (
                <li key={entry.version}>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>v{entry.version}</span>
                  {entry.date && <span> · {entry.date}</span>}
                  <ul className="mt-1 list-disc pl-4 space-y-0.5">
                    {entry.changes.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </li>
              ))}
            </ol>
          </details>
        )}
      </div>
    </div>
  )
}

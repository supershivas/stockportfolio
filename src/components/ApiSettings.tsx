import { useState, useEffect } from 'react'
import { X, Key, CheckCircle, XCircle, Loader2, ExternalLink, Cloud, Copy, Check } from 'lucide-react'
import { testApiKey } from '../services/marketData'
import { getBackupId, restoreFromCloud } from '../services/cloudBackup'
import { usePortfolioStore } from '../store/portfolioStore'

interface Props {
  onClose: () => void
}

export default function ApiSettings({ onClose }: Props) {
  const [key, setKey] = useState(localStorage.getItem('finnhub_api_key') || '')
  const [status, setStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle')
  const [backupId, setBackupId] = useState<string | null>(getBackupId())
  const [restoreCode, setRestoreCode] = useState('')
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [copied, setCopied] = useState(false)
  const setPositions = usePortfolioStore((s) => s.setPositions)

  useEffect(() => {
    if (localStorage.getItem('finnhub_api_key')) setStatus('ok')
  }, [])

  // Poll for backup ID appearing (e.g. after first sync)
  useEffect(() => {
    const interval = setInterval(() => {
      const id = getBackupId()
      if (id !== backupId) setBackupId(id)
    }, 1000)
    return () => clearInterval(interval)
  }, [backupId])

  async function handleTest() {
    if (!key.trim()) return
    setStatus('testing')
    const ok = await testApiKey(key.trim())
    setStatus(ok ? 'ok' : 'error')
  }

  function handleSave() {
    if (status !== 'ok') return
    localStorage.setItem('finnhub_api_key', key.trim())
    onClose()
  }

  function handleRemove() {
    localStorage.removeItem('finnhub_api_key')
    setKey('')
    setStatus('idle')
  }

  async function handleRestore() {
    const code = restoreCode.trim()
    if (!code) return
    setRestoreStatus('loading')
    const positions = await restoreFromCloud(code)
    if (positions) {
      setPositions(positions)
      setBackupId(getBackupId())
      setRestoreStatus('ok')
      setRestoreCode('')
    } else {
      setRestoreStatus('error')
    }
  }

  function handleCopy() {
    if (!backupId) return
    const link = `${window.location.origin}${window.location.pathname}?b=${backupId}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const shortId = backupId ? backupId.slice(-8) : ''

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl w-full max-w-md p-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Key size={18} className="text-accent/80" />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Données en temps réel</h2>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }} className="hover:text-accent/80 transition-colors"><X size={20} /></button>
        </div>

        <div className="rounded-xl p-4 mb-5 space-y-2" style={{ background: 'var(--card-bg-2)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Connectez <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Finnhub</span> pour obtenir les cours en temps réel.
            L'API gratuite offre 60 requêtes/minute.
          </p>
          <a
            href="https://finnhub.io/register"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-accent/80 hover:text-accent/70 text-sm font-medium"
          >
            <ExternalLink size={13} />
            Créer un compte gratuit sur Finnhub
          </a>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Clé API Finnhub</label>
            <input
              type="password"
              value={key}
              onChange={(e) => { setKey(e.target.value); setStatus('idle') }}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
            />
          </div>

          {status === 'ok' && (
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <CheckCircle size={15} /> Clé valide — connexion établie
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <XCircle size={15} /> Clé invalide ou erreur réseau
            </div>
          )}

          <div className="flex gap-3 pt-1">
            {localStorage.getItem('finnhub_api_key') && (
              <button
                onClick={handleRemove}
                className="px-3 py-2 rounded-lg border border-red-500/40 text-red-500 hover:bg-red-500/10 text-sm transition-colors"
              >
                Supprimer
              </button>
            )}
            <button
              onClick={handleTest}
              disabled={!key.trim() || status === 'testing'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors"
              style={{ border: '1px solid var(--card-border)', color: 'var(--text-secondary)' }}
            >
              {status === 'testing' && <Loader2 size={14} className="animate-spin" />}
              Tester la clé
            </button>
            <button
              onClick={handleSave}
              disabled={status !== 'ok'}
              className="flex-1 py-2 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-sm font-medium transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </div>

        <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          La clé est stockée uniquement dans votre navigateur (localStorage). Elle n'est jamais envoyée à nos serveurs.
        </p>

        {/* Applications section */}
        <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--card-border)' }}>
          <p className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Applications</p>
          <div className="flex gap-2">
            {[
              { name: 'Idée', url: 'https://idee-neon.vercel.app/', favicon: 'https://idee-neon.vercel.app/favicon.ico' },
              { name: 'Source', url: 'https://source-sigma-kohl.vercel.app/app', favicon: 'https://source-sigma-kohl.vercel.app/favicon.ico' },
              { name: 'AutoCompare', url: 'https://supershivas.github.io/projetV/', favicon: 'https://supershivas.github.io/projetV/favicon.ico' },
            ].map(app => (
              <a
                key={app.name}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex flex-col items-center gap-1.5 rounded-xl px-3 py-2.5 transition-colors"
                style={{ background: 'var(--card-bg-2)' }}
                title={app.name}
              >
                <img src={app.favicon} alt="" width={20} height={20} className="rounded-sm" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{app.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Cloud Backup section */}
        <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--card-border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Cloud size={14} style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Sauvegarde Cloud</p>
          </div>

          {backupId ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500 shrink-0" />
                <span className="text-sm text-green-500 font-medium">Sauvegarde active</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-mono px-2 py-1 rounded"
                  style={{ background: 'var(--card-bg-2)', color: 'var(--text-muted)' }}
                  title={backupId}
                >
                  Code : {shortId}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
                  style={{ border: '1px solid var(--card-border)', color: 'var(--text-muted)' }}
                  title="Copier le lien de partage (à bookmarker sur mobile)"
                >
                  {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  {copied ? 'Lien copié !' : 'Copier le lien'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Synchronisation en cours...</span>
            </div>
          )}

          <div className="mt-3 space-y-2">
            <label className="block text-xs" style={{ color: 'var(--text-muted)' }}>Restaurer depuis un code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={restoreCode}
                onChange={(e) => { setRestoreCode(e.target.value); setRestoreStatus('idle') }}
                placeholder="Collez votre code de sauvegarde"
                className="flex-1 rounded-lg px-3 py-2 text-xs focus:outline-none"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
              />
              <button
                onClick={handleRestore}
                disabled={!restoreCode.trim() || restoreStatus === 'loading'}
                className="px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50 transition-colors"
                style={{ background: 'var(--card-bg-2)', border: '1px solid var(--card-border)', color: 'var(--text-secondary)' }}
              >
                {restoreStatus === 'loading' ? <Loader2 size={12} className="animate-spin" /> : 'Restaurer'}
              </button>
            </div>
            {restoreStatus === 'ok' && (
              <div className="flex items-center gap-1.5 text-green-500 text-xs">
                <CheckCircle size={12} /> Portefeuille restauré avec succès
              </div>
            )}
            {restoreStatus === 'error' && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs">
                <XCircle size={12} /> Code invalide ou erreur réseau
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

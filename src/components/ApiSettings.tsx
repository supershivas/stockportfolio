import { useState, useEffect } from 'react'
import { X, Key, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react'
import { testApiKey } from '../services/marketData'

interface Props {
  onClose: () => void
}

export default function ApiSettings({ onClose }: Props) {
  const [key, setKey] = useState(localStorage.getItem('finnhub_api_key') || '')
  const [status, setStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle')

  useEffect(() => {
    if (localStorage.getItem('finnhub_api_key')) setStatus('ok')
  }, [])

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

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Key size={18} className="text-accent/80" />
            <h2 className="text-lg font-semibold text-white">Données en temps réel</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="bg-slate-900/60 rounded-xl p-4 mb-5 space-y-2">
          <p className="text-sm text-slate-300">
            Connectez <span className="font-semibold text-white">Finnhub</span> pour obtenir les cours en temps réel.
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
            <label className="block text-xs text-slate-400 mb-1">Clé API Finnhub</label>
            <input
              type="password"
              value={key}
              onChange={(e) => { setKey(e.target.value); setStatus('idle') }}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent"
            />
          </div>

          {status === 'ok' && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle size={15} /> Clé valide — connexion établie
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <XCircle size={15} /> Clé invalide ou erreur réseau
            </div>
          )}

          <div className="flex gap-3 pt-1">
            {localStorage.getItem('finnhub_api_key') && (
              <button
                onClick={handleRemove}
                className="px-3 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm transition-colors"
              >
                Supprimer
              </button>
            )}
            <button
              onClick={handleTest}
              disabled={!key.trim() || status === 'testing'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 text-sm disabled:opacity-50 transition-colors"
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

        <p className="text-xs text-slate-500 mt-4">
          La clé est stockée uniquement dans votre navigateur (localStorage). Elle n'est jamais envoyée à nos serveurs.
        </p>

        <div className="mt-5 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Applications</p>
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
                className="flex-1 flex flex-col items-center gap-1.5 bg-slate-900/60 hover:bg-slate-900 rounded-xl px-3 py-2.5 transition-colors"
                title={app.name}
              >
                <img src={app.favicon} alt="" width={20} height={20} className="rounded-sm" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <span className="text-[10px] text-slate-500">{app.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

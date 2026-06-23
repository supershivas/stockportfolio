import { useState } from 'react'
import { TrendingUp, Lock, Eye, EyeOff } from 'lucide-react'

const CORRECT = import.meta.env.VITE_APP_PASSWORD as string | undefined

export function isAuthenticated(): boolean {
  if (!CORRECT) return true // no password set → open
  return sessionStorage.getItem('auth') === CORRECT
}

export function logout() {
  sessionStorage.removeItem('auth')
}

interface Props {
  onAuth: () => void
}

export default function Login({ onAuth }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [show, setShow] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password === CORRECT) {
      sessionStorage.setItem('auth', CORRECT)
      onAuth()
    } else {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--content-bg)' }}>
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <TrendingUp size={22} color="#fff" />
          </div>
          <h1 className="text-2xl font-bold font-title" style={{ color: 'var(--text-primary)' }}>PortfolioAI</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Accès privé — entrez votre mot de passe</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
              <Lock size={11} className="inline mr-1" />
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false) }}
                autoFocus
                placeholder="••••••••"
                className="w-full rounded-lg px-3 py-2.5 pr-9 text-sm focus:outline-none"
                style={{
                  background: 'var(--input-bg)',
                  border: `1px solid ${error ? '#f87171' : 'var(--input-border)'}`,
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="button"
                onClick={() => setShow(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
                tabIndex={-1}
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {error && <p className="text-xs text-red-400 mt-1.5">Mot de passe incorrect</p>}
          </div>

          <button
            type="submit"
            disabled={!password}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-40 transition-opacity"
            style={{ background: 'var(--accent)' }}
          >
            Accéder
          </button>
        </form>

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)', opacity: 0.4 }}>PortfolioAI · accès privé</p>
      </div>
    </div>
  )
}

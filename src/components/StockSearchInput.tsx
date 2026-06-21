import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Loader2, Filter } from 'lucide-react'
import { searchStocks, StockSearchResult } from '../data/stockDatabase'

interface Props {
  onSelect: (stock: StockSearchResult) => void
  placeholder?: string
}

export default function StockSearchInput({ onSelect, placeholder = 'Rechercher par ticker ou nom...' }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StockSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(-1)
  const [peaOnly, setPeaOnly] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // dropdown position via fixed to escape overflow:hidden parents
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({})

  const updateDropPosition = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setDropStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    })
  }, [])

  const runSearch = useCallback((q: string, pea: boolean) => {
    if (!q) { setResults([]); setOpen(false); return }
    setLoading(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setResults(searchStocks(q, pea))
      setOpen(true)
      setLoading(false)
      setCursor(-1)
      updateDropPosition()
    }, 180)
  }, [updateDropPosition])

  useEffect(() => { runSearch(query, peaOnly) }, [query, peaOnly, runSearch])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    window.addEventListener('scroll', updateDropPosition, true)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      window.removeEventListener('scroll', updateDropPosition, true)
    }
  }, [updateDropPosition])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
    if (e.key === 'Enter' && cursor >= 0) { e.preventDefault(); select(results[cursor]) }
    if (e.key === 'Escape') setOpen(false)
  }

  function select(stock: StockSearchResult) {
    onSelect(stock)
    setQuery('')
    setOpen(false)
    setResults([])
  }

  const typeColors: Record<string, string> = {
    Action: 'bg-accent/20 text-accent/70',
    ETF: 'bg-emerald-500/20 text-emerald-300',
    Obligation: 'bg-yellow-500/20 text-yellow-300',
  }

  const dropdown = open && results.length > 0 ? (
    <div style={{ ...dropStyle, background: 'var(--card-bg)', border: '1px solid var(--card-border)' }} className="rounded-lg shadow-2xl overflow-hidden">
      {results.map((s, i) => (
        <button
          key={s.ticker}
          onMouseDown={() => select(s)}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors"
          style={{ background: i === cursor ? 'var(--hover-bg)' : 'transparent' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = i === cursor ? 'var(--hover-bg)' : 'transparent'}
        >
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${typeColors[s.type]}`}>{s.type}</span>
          <span className="font-semibold text-sm shrink-0 w-20" style={{ color: 'var(--text-primary)' }}>{s.ticker}</span>
          <span className="text-sm truncate flex-1" style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
          <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{s.country}</span>
          {s.pea && (
            <span className="text-xs bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded font-medium shrink-0">PEA</span>
          )}
        </button>
      ))}
    </div>
  ) : open && !loading && results.length === 0 && query.length > 0 ? (
    <div style={{ ...dropStyle, background: 'var(--card-bg)', border: '1px solid var(--card-border)' }} className="rounded-lg px-4 py-3">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucun résultat pour « {query} »{peaOnly ? ' (filtre PEA actif)' : ''}</p>
    </div>
  ) : null

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-slate-400">Rechercher une action / ETF</label>
        <button
          type="button"
          onClick={() => setPeaOnly((v) => !v)}
          className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors ${
            peaOnly
              ? 'bg-green-500/20 text-green-300 border border-green-500/40'
              : 'bg-slate-700 text-slate-400 border border-slate-600 hover:text-white'
          }`}
        >
          <Filter size={10} />
          PEA uniquement
        </button>
      </div>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        {loading && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query) { updateDropPosition(); setOpen(true) } }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-lg pl-9 pr-9 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
        />
      </div>
      {/* Portal-like fixed dropdown */}
      {dropdown}
    </div>
  )
}

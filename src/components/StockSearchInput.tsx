import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Loader2 } from 'lucide-react'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = useCallback((q: string) => {
    if (!q) { setResults([]); setOpen(false); return }
    setLoading(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setResults(searchStocks(q))
      setOpen(true)
      setLoading(false)
      setCursor(-1)
    }, 180)
  }, [])

  useEffect(() => { runSearch(query) }, [query, runSearch])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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
    Action: 'bg-indigo-500/20 text-indigo-300',
    ETF: 'bg-emerald-500/20 text-emerald-300',
    Obligation: 'bg-yellow-500/20 text-yellow-300',
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs text-slate-400 mb-1">Rechercher une action / ETF</label>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        {loading && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 pr-9 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-2xl overflow-hidden">
          {results.map((s, i) => (
            <button
              key={s.ticker}
              onMouseDown={() => select(s)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-600 transition-colors ${
                i === cursor ? 'bg-slate-600' : ''
              }`}
            >
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${typeColors[s.type]}`}>{s.type}</span>
              <span className="font-semibold text-white text-sm shrink-0 w-20">{s.ticker}</span>
              <span className="text-slate-300 text-sm truncate flex-1">{s.name}</span>
              <span className="text-slate-400 text-xs shrink-0">{s.country}</span>
              <span className="text-slate-300 text-sm shrink-0 font-medium">
                {s.currentPrice} {s.currency}
              </span>
            </button>
          ))}
        </div>
      )}

      {open && !loading && results.length === 0 && query.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3">
          <p className="text-sm text-slate-400">Aucun résultat pour « {query} »</p>
        </div>
      )}
    </div>
  )
}

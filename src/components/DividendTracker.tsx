import { useState, useEffect, useCallback, useRef } from 'react'
import { usePortfolioStore } from '../store/portfolioStore'
import Sources from './Sources'
import { RefreshCw, Calendar, Euro, AlertCircle, Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DividendData {
  ticker: string
  name: string
  price: number | null
  currency: string
  sector: string
  industry: string
  annualDividend: number | null
  trailingAnnualDividend: number | null
  yieldPct: number | null
  trailingYield: number | null
  exDividendDate: string | null
  dividendDate: string | null
  payoutRatio: number | null
  fiveYearAvgYield: number | null
  consecutiveYears: number | null
}

// ─── Hook: fetch dividend data for a ticker ───────────────────────────────────

function useDividendData(ticker: string) {
  const [data, setData] = useState<DividendData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/dividend?ticker=${encodeURIComponent(ticker)}`)
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [ticker])

  return { data, loading, error, refresh: fetch_ }
}

// ─── Sub-component: one portfolio position row ────────────────────────────────

function PositionDividendRow({ pos, eurUsd, isExpanded, onToggle }: {
  pos: { ticker: string; name: string; quantity: number; currency: 'USD' | 'EUR' }
  eurUsd: number
  isExpanded: boolean
  onToggle: () => void
}) {
  const { data, loading, refresh } = useDividendData(pos.ticker)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!fetchedRef.current) { fetchedRef.current = true; refresh() }
  }, [refresh])

  const toEur = (v: number) => pos.currency === 'USD' ? v / eurUsd : v
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n)
  const fmtPct = (n: number) => `${n.toFixed(2)}%`

  const annual = data?.annualDividend ?? data?.trailingAnnualDividend ?? null
  const yield_ = data?.yieldPct ?? data?.trailingYield ?? null
  const annualIncomeEur = annual != null ? toEur(annual * pos.quantity) : null

  const daysUntil = (d: string | null) => {
    if (!d) return null
    return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  }
  const exDays = daysUntil(data?.exDividendDate ?? null)

  return (
    <>
      <tr
        className="border-b border-slate-700 hover:bg-slate-700/40 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-accent/80">{pos.ticker.slice(0, 2)}</span>
            </div>
            <div>
              <div className="font-medium text-white text-sm">{pos.ticker}</div>
              <div className="text-xs text-slate-500 truncate max-w-[120px]">{data?.name ?? pos.name}</div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-slate-400 text-xs">{data?.sector || '—'}</td>
        <td className="px-4 py-3 text-center text-slate-300 text-sm">{pos.quantity}</td>
        <td className="px-4 py-3">
          {loading ? (
            <Loader2 size={12} className="animate-spin text-slate-500" />
          ) : yield_ != null ? (
            <span className={`font-semibold text-sm ${yield_ >= 4 ? 'text-green-400' : yield_ >= 2 ? 'text-yellow-400' : 'text-slate-300'}`}>
              {fmtPct(yield_)}
            </span>
          ) : <span className="text-slate-600 text-xs">—</span>}
        </td>
        <td className="px-4 py-3">
          {loading ? <Loader2 size={12} className="animate-spin text-slate-500" /> :
            annual != null ? <span className="text-slate-300 text-sm">{fmt(toEur(annual))}/action</span>
              : <span className="text-slate-600 text-xs">—</span>}
        </td>
        <td className="px-4 py-3">
          {data?.exDividendDate ? (
            <div>
              <span className={`text-xs font-medium ${exDays != null && exDays >= 0 && exDays <= 7 ? 'text-red-400' : exDays != null && exDays >= 0 && exDays <= 30 ? 'text-yellow-400' : 'text-slate-400'}`}>
                {new Date(data.exDividendDate).toLocaleDateString('fr-FR')}
              </span>
              {exDays != null && exDays >= 0 && exDays <= 60 && (
                <span className="ml-1.5 text-xs text-slate-500">J-{exDays}</span>
              )}
            </div>
          ) : <span className="text-slate-600 text-xs">—</span>}
        </td>
        <td className="px-4 py-3">
          {annualIncomeEur != null ? (
            <span className="font-semibold text-green-400">{fmt(annualIncomeEur)}/an</span>
          ) : <span className="text-slate-600 text-xs">—</span>}
        </td>
        <td className="px-4 py-3 text-slate-500 text-xs">
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </td>
      </tr>
      {isExpanded && data && (
        <tr className="border-b border-slate-700 bg-slate-900/50">
          <td colSpan={8} className="px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="text-slate-500 mb-1">Dividende annoncé</div>
                <div className="text-white font-medium">{data.annualDividend != null ? `${data.annualDividend} ${data.currency}` : '—'}</div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Dividende trailing</div>
                <div className="text-white font-medium">{data.trailingAnnualDividend != null ? `${data.trailingAnnualDividend} ${data.currency}` : '—'}</div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Rendement moy. 5 ans</div>
                <div className="text-white font-medium">{data.fiveYearAvgYield != null ? `${data.fiveYearAvgYield.toFixed(2)}%` : '—'}</div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Payout Ratio</div>
                <div className={`font-medium ${data.payoutRatio != null && data.payoutRatio > 90 ? 'text-red-400' : data.payoutRatio != null && data.payoutRatio > 70 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {data.payoutRatio != null ? `${data.payoutRatio.toFixed(1)}%` : '—'}
                </div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Date de paiement</div>
                <div className="text-white font-medium">{data.dividendDate ? new Date(data.dividendDate).toLocaleDateString('fr-FR') : '—'}</div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Cours actuel</div>
                <div className="text-white font-medium">{data.price != null ? `${data.price} ${data.currency}` : '—'}</div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Secteur</div>
                <div className="text-white font-medium">{data.sector || '—'}</div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Industrie</div>
                <div className="text-white font-medium">{data.industry || '—'}</div>
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); refresh() }} className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors">
              <RefreshCw size={11} /> Actualiser
            </button>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Sub-component: dividend search widget ────────────────────────────────────

function DividendSearch() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<DividendData | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (ticker: string) => {
    if (!ticker.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/dividend?ticker=${encodeURIComponent(ticker.trim())}`)
      setResult(res.ok ? await res.json() : null)
    } catch {
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInput = (v: string) => {
    setQuery(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (v.length >= 2) timerRef.current = setTimeout(() => search(v), 600)
    else { setResult(null); setSearched(false) }
  }

  const yield_ = result?.yieldPct ?? result?.trailingYield ?? null

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Search size={15} className="text-slate-400" />
        <h2 className="text-sm font-semibold text-white">Rechercher un dividende</h2>
      </div>
      <p className="text-xs text-slate-500">Entrez n'importe quel ticker Yahoo Finance pour obtenir ses données de dividende en temps réel.</p>
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
        <input
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search(query)}
          placeholder="ex: TTE.PA, MSFT, AIR.PA…"
          className="w-full rounded-lg pl-9 pr-9 py-2 text-sm focus:outline-none transition-colors bg-slate-900 border border-slate-700 focus:border-accent text-white placeholder:text-slate-600"
        />
      </div>

      {searched && !loading && !result && (
        <p className="text-xs text-slate-500">Aucune donnée trouvée pour « {query} ».</p>
      )}

      {result && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-bold text-white">{result.ticker}</div>
              <div className="text-sm text-slate-400">{result.name}</div>
              {result.sector && <div className="text-xs text-slate-500 mt-0.5">{result.sector} · {result.industry}</div>}
            </div>
            {yield_ != null && (
              <div className="text-right shrink-0">
                <div className={`text-2xl font-bold ${yield_ >= 4 ? 'text-green-400' : yield_ >= 2 ? 'text-yellow-400' : 'text-slate-300'}`}>
                  {yield_.toFixed(2)}%
                </div>
                <div className="text-xs text-slate-500">rendement</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Cours', value: result.price != null ? `${result.price} ${result.currency}` : null },
              { label: 'Dividende annuel', value: result.annualDividend != null ? `${result.annualDividend} ${result.currency}` : result.trailingAnnualDividend != null ? `${result.trailingAnnualDividend} ${result.currency} (trailing)` : null },
              { label: 'Rendement trailing', value: result.trailingYield != null ? `${result.trailingYield.toFixed(2)}%` : null },
              { label: 'Moy. 5 ans', value: result.fiveYearAvgYield != null ? `${result.fiveYearAvgYield.toFixed(2)}%` : null },
              { label: 'Payout Ratio', value: result.payoutRatio != null ? `${result.payoutRatio.toFixed(1)}%` : null, warn: result.payoutRatio != null && result.payoutRatio > 90 },
              { label: 'Ex-dividende', value: result.exDividendDate ? new Date(result.exDividendDate).toLocaleDateString('fr-FR') : null },
              { label: 'Date paiement', value: result.dividendDate ? new Date(result.dividendDate).toLocaleDateString('fr-FR') : null },
            ].filter(r => r.value != null).map(r => (
              <div key={r.label} className="rounded bg-slate-800 px-3 py-2">
                <div className="text-[10px] text-slate-500 mb-0.5">{r.label}</div>
                <div className={`text-xs font-semibold ${r.warn ? 'text-red-400' : 'text-white'}`}>{r.value}</div>
              </div>
            ))}
          </div>

          {result.exDividendDate && (() => {
            const days = Math.ceil((new Date(result.exDividendDate).getTime() - Date.now()) / 86400000)
            if (days < 0 || days > 90) return null
            return (
              <div className={`rounded-lg px-3 py-2 text-xs flex items-center gap-2 ${days <= 7 ? 'bg-red-500/10 border border-red-500/30 text-red-300' : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-300'}`}>
                <AlertCircle size={12} />
                Ex-dividende dans <strong>{days} jour{days > 1 ? 's' : ''}</strong> — acheter avant le {new Date(result.exDividendDate).toLocaleDateString('fr-FR')} pour percevoir le dividende.
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DividendTracker() {
  const positions = usePortfolioStore((s) => s.positions)
  const [eurUsd, setEurUsd] = useState(1.08)
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dividend?ticker=EURUSD=X')
      .then(r => r.json())
      .then(d => { if (d.price) setEurUsd(d.price) })
      .catch(() => {})
  }, [])

  // Portfolio summary cards are computed from live data per row — but rows
  // don't bubble data up, so we show what we know from positions only as placeholders.
  const portfolioPositions = positions.filter(p => p.quantity > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dividende Tracker</h1>
        <p className="text-slate-400 text-sm mt-1">
          Dividendes live depuis Yahoo Finance pour chaque position de ton portefeuille.
          Les <strong className="text-yellow-400">ex-dates</strong> sont critiques : tu dois détenir l'action <em>avant</em> cette date pour percevoir le dividende.
        </p>
      </div>

      {/* Portfolio dividend table */}
      {portfolioPositions.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-8 text-center">
          <div className="text-slate-500 text-sm">Aucune position dans le portefeuille.</div>
          <div className="text-slate-600 text-xs mt-1">Ajoute des actions dans l'onglet Portefeuille pour voir leurs dividendes.</div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700 flex items-center gap-2">
            <Euro size={15} className="text-green-400" />
            <h2 className="text-sm font-semibold text-white">Mon portefeuille — données live</h2>
            <span className="text-xs text-slate-500 ml-auto">Cliquez sur une ligne pour les détails</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {['Ticker / Nom', 'Secteur', 'Qté', 'Rendement', 'Dividende', 'Ex-Date', 'Revenu annuel', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolioPositions.map(pos => (
                  <PositionDividendRow
                    key={pos.ticker}
                    pos={pos}
                    eurUsd={eurUsd}
                    isExpanded={expandedTicker === pos.ticker}
                    onToggle={() => setExpandedTicker(t => t === pos.ticker ? null : pos.ticker)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly calendar — static estimate using position data only */}
      {portfolioPositions.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={15} className="text-yellow-400" />
            <h2 className="text-sm font-semibold text-white">Calendrier mensuel — estimation</h2>
            <span className="text-xs text-slate-500 ml-1">(basé sur les données Yahoo chargées)</span>
          </div>
          <MonthlyCalendar positions={portfolioPositions} eurUsd={eurUsd} />
        </div>
      )}

      {/* Search widget */}
      <DividendSearch />

      <Sources sources={[
        { label: 'Dividendinvestor.com', url: 'https://www.dividendinvestor.com/' },
        { label: 'Euronext — Calendrier Dividendes', url: 'https://live.euronext.com/fr/products/dividends' },
        { label: 'Simply Safe Dividends', url: 'https://www.simplysafedividends.com/' },
        { label: 'S&P Dividend Aristocrats', url: 'https://www.proshares.com/our-etfs/equity/nobl' },
      ]} />
    </div>
  )
}

// ─── Monthly calendar ─────────────────────────────────────────────────────────

function MonthlyCalendar({ positions, eurUsd }: { positions: { ticker: string; currency: 'USD' | 'EUR'; quantity: number }[]; eurUsd: number }) {
  // Load all dividend data for positions
  const [dataMap, setDataMap] = useState<Record<string, DividendData>>({})

  useEffect(() => {
    positions.forEach(pos => {
      fetch(`/api/dividend?ticker=${encodeURIComponent(pos.ticker)}`)
        .then(r => r.json())
        .then(d => setDataMap(prev => ({ ...prev, [pos.ticker]: d })))
        .catch(() => {})
    })
  }, [positions.map(p => p.ticker).join(',')])  // eslint-disable-line

  const toEur = (v: number, cur: string) => cur === 'USD' ? v / eurUsd : v
  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  // For each month, estimate income from positions that have dividend data
  const monthData = months.map((label, i) => {
    const payers: { ticker: string; amount: number }[] = []
    positions.forEach(pos => {
      const d = dataMap[pos.ticker]
      if (!d) return
      const annual = d.annualDividend ?? d.trailingAnnualDividend
      if (!annual) return
      // Use pay date to assign to correct month
      const payMonth = d.dividendDate ? new Date(d.dividendDate).getMonth() : null
      const exMonth = d.exDividendDate ? new Date(d.exDividendDate).getMonth() : null
      const targetMonth = payMonth ?? exMonth
      if (targetMonth == null) return
      // Quarterly: assign to payMonth and 3 months before/after
      // Annual: just payMonth
      // We don't know frequency from Yahoo directly, so assign annual/4 to payMonth only (conservative)
      if (targetMonth === i) {
        payers.push({ ticker: pos.ticker, amount: toEur(annual * pos.quantity, pos.currency) })
      }
    })
    const total = payers.reduce((s, p) => s + p.amount, 0)
    return { label, i, total, payers }
  })

  const maxIncome = Math.max(...monthData.map(m => m.total), 1)

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
      {monthData.map(m => (
        <div
          key={m.label}
          className="rounded-lg p-3 transition-colors"
          style={{
            background: m.i === currentMonth ? 'rgba(99,102,241,0.1)' : 'var(--card-bg-2)',
            border: m.i === currentMonth ? '1px solid rgba(99,102,241,0.4)' : '1px solid var(--card-border)',
          }}
        >
          <div className="text-xs text-slate-400 font-medium mb-1.5">{m.label} {currentYear}</div>
          {m.total > 0 ? (
            <>
              <div className="h-1 rounded-full bg-slate-700 mb-1.5 overflow-hidden">
                <div className="h-full rounded-full bg-green-500" style={{ width: `${(m.total / maxIncome) * 100}%` }} />
              </div>
              <div className="text-sm font-bold text-green-400">{fmt(m.total)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{m.payers.map(p => p.ticker).join(', ')}</div>
            </>
          ) : (
            <div className="text-slate-700 text-sm font-medium">—</div>
          )}
        </div>
      ))}
    </div>
  )
}

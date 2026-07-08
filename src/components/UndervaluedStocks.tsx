import { useState, useMemo, useCallback, useEffect } from 'react'
import { ChevronDown, ChevronUp, Search, TrendingDown, Info, RefreshCw } from 'lucide-react'
import { stocksData, StockFundamentals } from '../data/fundamentals'
import { calculateValuationScore, ValuationScore } from '../utils/valuationScore'
import Sources from './Sources'
import { useLiveQuotes } from '../hooks/useLiveQuotes'

// Fields fetched live from Yahoo Finance quoteSummary via /api/fundamentals —
// only present ones (Yahoo doesn't cover every ticker/field) override the
// static reference dataset, field by field.
type LiveFundamentals = Partial<Pick<StockFundamentals,
  'currentPrice' | 'marketCap' | 'pe' | 'forwardPE' | 'pb' | 'ps' | 'ev_ebitda' |
  'roe' | 'roa' | 'grossMargin' | 'operatingMargin' | 'netMargin' |
  'revenueGrowthYoY' | 'epsGrowthYoY' | 'debtToEquity' | 'currentRatio' |
  'dividendYield' | 'payoutRatio' | 'analystTarget' | 'analystUpside' |
  'numAnalysts' | 'grahamValue' | 'dcfValue'
>>

const LIVE_FIELDS = [
  'currentPrice', 'marketCap', 'pe', 'forwardPE', 'pb', 'ps', 'ev_ebitda',
  'roe', 'roa', 'grossMargin', 'operatingMargin', 'netMargin',
  'revenueGrowthYoY', 'epsGrowthYoY', 'debtToEquity', 'currentRatio',
  'dividendYield', 'payoutRatio', 'analystTarget', 'analystUpside',
  'numAnalysts', 'grahamValue', 'dcfValue',
] as const

const COUNTRY_FLAGS: Record<string, string> = {
  France: '🇫🇷',
  Allemagne: '🇩🇪',
  USA: '🇺🇸',
}

type SortKey = 'score' | 'pe' | 'roe' | 'analystUpside' | 'dividendYield'
type GradeFilter = 'all' | 'A' | 'B' | 'C' | 'D' | 'F'

const gradeStyle = (grade: string) => {
  switch (grade) {
    case 'A': return 'bg-green-500/20 text-green-400 border border-green-500/40'
    case 'B': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
    case 'C': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
    case 'D': return 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
    case 'F': return 'bg-red-500/20 text-red-400 border border-red-500/40'
    default: return ''
  }
}

const gradeBarColor = (grade: string) => {
  switch (grade) {
    case 'A': return 'bg-green-500'
    case 'B': return 'bg-emerald-500'
    case 'C': return 'bg-yellow-500'
    case 'D': return 'bg-orange-500'
    case 'F': return 'bg-red-500'
    default: return 'bg-slate-500'
  }
}

function ScoreBar({ value, max = 25, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-6 text-right">{value}</span>
    </div>
  )
}

function GradeLegend() {
  const grades = [
    { grade: 'A', label: 'Très Sous-Évalué', range: '75-100' },
    { grade: 'B', label: 'Sous-Évalué', range: '60-74' },
    { grade: 'C', label: 'Juste Valeur', range: '45-59' },
    { grade: 'D', label: 'Sur-Évalué', range: '30-44' },
    { grade: 'F', label: 'Très Sur-Évalué', range: '0-29' },
  ]
  return (
    <div className="flex flex-wrap gap-2">
      {grades.map(({ grade, label, range }) => (
        <div key={grade} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${gradeStyle(grade)}`}>
          <span className="font-bold">{grade}</span>
          <span className="opacity-80">{label}</span>
          <span className="opacity-50">({range})</span>
        </div>
      ))}
    </div>
  )
}

function TopPickCard({ stock, score }: { stock: StockFundamentals; score: ValuationScore }) {
  const upside = ((stock.grahamValue - stock.currentPrice) / stock.currentPrice * 100)
  return (
    <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-lg">{stock.ticker}</span>
            <span className="text-lg">{COUNTRY_FLAGS[stock.country] || ''}</span>
            <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${gradeStyle(score.grade)}`}>{score.grade}</span>
          </div>
          <div className="text-slate-400 text-sm mt-0.5">{stock.name}</div>
          <div className="text-slate-500 text-xs">{stock.sector}</div>
        </div>
        <div className="text-right">
          <div className="text-white font-bold">{stock.currentPrice.toFixed(2)} {stock.currency}</div>
          <div className="text-slate-400 text-xs">Cible: {stock.analystTarget.toFixed(2)}</div>
          <div className="text-green-400 text-xs">+{stock.analystUpside.toFixed(1)}%</div>
        </div>
      </div>
      <div className="mb-3">
        <div className="text-slate-400 text-xs mb-1.5">Score global</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${score.total}%` }} />
          </div>
          <span className="text-green-400 font-bold text-sm">{score.total}/100</span>
        </div>
      </div>
      <ul className="space-y-1">
        {score.signals.slice(0, 3).map((s, i) => (
          <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
            <span className="text-green-400 mt-0.5">•</span>
            {s}
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700">
        <div>
          <div className="text-slate-500 text-xs">P/E</div>
          <div className="text-white text-sm font-medium">{stock.pe.toFixed(1)}x</div>
        </div>
        <div>
          <div className="text-slate-500 text-xs">ROE</div>
          <div className="text-green-400 text-sm font-medium">{stock.roe.toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-slate-500 text-xs">Dividende</div>
          <div className="text-white text-sm font-medium">{stock.dividendYield.toFixed(1)}%</div>
        </div>
      </div>
      {upside > 0 && (
        <div className="mt-2 text-xs text-green-400">
          Décote {upside.toFixed(0)}% vs valeur Graham ({stock.grahamValue.toFixed(0)} {stock.currency})
        </div>
      )}
    </div>
  )
}

interface ExpandedRowProps {
  stock: StockFundamentals
  score: ValuationScore
}

function ExpandedDetail({ stock, score }: ExpandedRowProps) {
  const barColor = gradeBarColor(score.grade)
  const dcfDiscount = ((stock.dcfValue - stock.currentPrice) / stock.currentPrice * 100)
  const grahamDiscount = ((stock.grahamValue - stock.currentPrice) / stock.currentPrice * 100)

  return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
        {/* Score breakdown */}
        <div className="rounded-lg bg-slate-800 border border-slate-700 p-4">
          <div className="text-sm font-semibold text-white mb-3">Décomposition du Score</div>
          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Valorisation</span><span>{score.components.valuation}/25</span>
              </div>
              <ScoreBar value={score.components.valuation} color={barColor} />
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Rentabilité</span><span>{score.components.profitability}/25</span>
              </div>
              <ScoreBar value={score.components.profitability} color={barColor} />
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Croissance</span><span>{score.components.growth}/25</span>
              </div>
              <ScoreBar value={score.components.growth} color={barColor} />
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Santé Financière</span><span>{score.components.health}/25</span>
              </div>
              <ScoreBar value={score.components.health} color={barColor} />
            </div>
          </div>
        </div>

        {/* Signals + description */}
        <div className="rounded-lg bg-slate-800 border border-slate-700 p-4">
          <div className="text-sm font-semibold text-white mb-3">Signaux Clés</div>
          <ul className="space-y-1.5 mb-3">
            {score.signals.map((s, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-accent/80 mt-0.5 shrink-0">•</span>
                {s}
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500 italic">{stock.description}</p>
        </div>

        {/* Fundamental detail */}
        <div className="rounded-lg bg-slate-800 border border-slate-700 p-4">
          <div className="text-sm font-semibold text-white mb-3">Métriques Détaillées</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Valeur DCF</span>
              <span className={dcfDiscount > 0 ? 'text-green-400' : 'text-red-400'}>
                {stock.dcfValue.toFixed(0)} {stock.currency} ({dcfDiscount > 0 ? '+' : ''}{dcfDiscount.toFixed(0)}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Valeur Graham</span>
              <span className={grahamDiscount > 0 ? 'text-green-400' : 'text-red-400'}>
                {stock.grahamValue.toFixed(0)} {stock.currency} ({grahamDiscount > 0 ? '+' : ''}{grahamDiscount.toFixed(0)}%)
              </span>
            </div>
            <div className="border-t border-slate-700 pt-1.5 mt-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">D/Capitaux propres</span>
                <span className={stock.debtToEquity < 0.5 ? 'text-green-400' : stock.debtToEquity < 1.2 ? 'text-yellow-400' : 'text-red-400'}>
                  {stock.debtToEquity.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-400">Ratio courant</span>
                <span className={stock.currentRatio >= 1.5 ? 'text-green-400' : stock.currentRatio >= 1 ? 'text-yellow-400' : 'text-red-400'}>
                  {stock.currentRatio.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-400">Couverture intérêts</span>
                <span className={stock.interestCoverage >= 8 ? 'text-green-400' : stock.interestCoverage >= 4 ? 'text-yellow-400' : 'text-red-400'}>
                  {stock.interestCoverage.toFixed(1)}x
                </span>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-1.5 mt-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Marge brute</span>
                <span className="text-white">{stock.grossMargin.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-400">ROIC</span>
                <span className={stock.roic >= 15 ? 'text-green-400' : 'text-white'}>{stock.roic.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-400">Forward P/E</span>
                <span className="text-white">{stock.forwardPE.toFixed(1)}x</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}

function ExpandedRow({ stock, score }: ExpandedRowProps) {
  return (
    <td colSpan={12} className="px-4 pb-4 pt-0 bg-slate-800/50">
      <ExpandedDetail stock={stock} score={score} />
    </td>
  )
}

function MobileStockCard({ stock, score, isExpanded, onToggle }: ExpandedRowProps & { isExpanded: boolean; onToggle: () => void }) {
  const peBelowSector = stock.pe < stock.sectorPE
  const grahamDiscount = ((stock.grahamValue - stock.currentPrice) / stock.currentPrice * 100)

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
      <button onClick={onToggle} className="w-full text-left px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-accent/80">{stock.ticker.slice(0, 2)}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-white">{stock.ticker}</span>
                <span>{COUNTRY_FLAGS[stock.country] || ''}</span>
              </div>
              <div className="text-xs text-slate-400 truncate">{stock.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-center">
              <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${gradeStyle(score.grade)}`}>{score.grade}</span>
              <span className="text-[10px] text-slate-500 mt-0.5">{score.total}/100</span>
            </div>
            {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-700/60">
          <div>
            <div className="text-[10px] text-slate-500">Prix / Cible</div>
            <div className="text-xs font-medium text-white">{stock.currentPrice.toFixed(2)}</div>
            <div className="text-[10px] text-slate-500">→ {stock.analystTarget.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">P/E vs Sect.</div>
            <div className={`text-xs font-medium ${peBelowSector ? 'text-green-400' : 'text-red-400'}`}>{stock.pe.toFixed(1)}x</div>
            <div className="text-[10px] text-slate-500">{stock.sectorPE.toFixed(1)}x</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">ROE</div>
            <div className={`text-xs font-medium ${stock.roe >= 20 ? 'text-green-400' : stock.roe >= 10 ? 'text-slate-300' : 'text-red-400'}`}>{stock.roe.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">Upside</div>
            <div className={`text-xs font-medium ${stock.analystUpside >= 20 ? 'text-green-400' : stock.analystUpside >= 10 ? 'text-slate-300' : 'text-red-400'}`}>+{stock.analystUpside.toFixed(1)}%</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-2">
          <div>
            <div className="text-[10px] text-slate-500">Dividende</div>
            <div className={`text-xs font-medium ${stock.dividendYield >= 4 ? 'text-green-400' : 'text-slate-300'}`}>{stock.dividendYield.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">Marge Nette</div>
            <div className={`text-xs font-medium ${stock.netMargin >= 20 ? 'text-green-400' : stock.netMargin >= 10 ? 'text-slate-300' : 'text-orange-400'}`}>{stock.netMargin.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">Graham</div>
            <div className={`text-xs font-medium ${grahamDiscount > 0 ? 'text-green-400' : 'text-red-400'}`}>{grahamDiscount > 0 ? '+' : ''}{grahamDiscount.toFixed(0)}%</div>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-700/60 bg-slate-800/50">
          <ExpandedDetail stock={stock} score={score} />
        </div>
      )}
    </div>
  )
}

export default function UndervaluedStocks() {
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all')
  const [sortBy, setSortBy] = useState<SortKey>('score')
  const [undervaluedOnly, setUndervaluedOnly] = useState(false)
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null)

  const tickers = useMemo(() => stocksData.map((s) => s.ticker), [])
  const { quotes: liveQuotes, loading: liveLoading, refresh: refreshLive, lastUpdated } = useLiveQuotes(tickers)

  const [fundamentals, setFundamentals] = useState<Record<string, LiveFundamentals>>({})
  const [fundamentalsLoading, setFundamentalsLoading] = useState(false)

  const loadFundamentals = useCallback(async () => {
    setFundamentalsLoading(true)
    const entries = await Promise.all(tickers.map(async (t) => {
      try {
        const res = await fetch(`/api/fundamentals?ticker=${encodeURIComponent(t)}`)
        if (!res.ok) return null
        const d = await res.json()
        return [t, d] as const
      } catch {
        return null
      }
    }))
    const map: Record<string, LiveFundamentals> = {}
    entries.forEach((e) => { if (e) map[e[0]] = e[1] })
    setFundamentals(map)
    setFundamentalsLoading(false)
  }, [tickers])

  useEffect(() => { loadFundamentals() }, [loadFundamentals])

  const refreshAll = useCallback(() => {
    refreshLive()
    loadFundamentals()
  }, [refreshLive, loadFundamentals])

  // Merge live price + fundamentals into the static reference dataset —
  // field by field, only where Yahoo actually returned a value. Sector
  // averages (sectorPE/sectorPB) are then recomputed from this merged set,
  // so the "vs sector" comparison is a real average of our live peer group
  // rather than a hardcoded guess.
  const liveStocks = useMemo(() => {
    const merged = stocksData.map((s) => {
      const live = liveQuotes.get(s.ticker)
      const f = fundamentals[s.ticker]
      const out: StockFundamentals = { ...s }
      if (live) out.currentPrice = live.price
      if (f) {
        LIVE_FIELDS.forEach((key) => {
          const v = f[key]
          if (v != null) (out as unknown as Record<string, number>)[key] = v
        })
      }
      return out
    })

    const bySector: Record<string, { peSum: number; pbSum: number; n: number }> = {}
    merged.forEach((s) => {
      const g = (bySector[s.sector] ??= { peSum: 0, pbSum: 0, n: 0 })
      g.peSum += s.pe; g.pbSum += s.pb; g.n += 1
    })
    return merged.map((s) => {
      const g = bySector[s.sector]
      return g && g.n > 0 ? { ...s, sectorPE: g.peSum / g.n, sectorPB: g.pbSum / g.n } : s
    })
  }, [liveQuotes, fundamentals])

  const scored = useMemo(
    () => liveStocks.map((s) => ({ stock: s, score: calculateValuationScore(s) })),
    [liveStocks]
  )

  const sectors = useMemo(() => ['all', ...Array.from(new Set(stocksData.map((s) => s.sector)))], [])
  const countries = useMemo(() => ['all', ...Array.from(new Set(stocksData.map((s) => s.country)))], [])

  const topPicks = useMemo(
    () => scored.filter((x) => x.score.grade === 'A').sort((a, b) => b.score.total - a.score.total).slice(0, 3),
    [scored]
  )

  const filtered = useMemo(() => {
    return scored
      .filter(({ stock, score }) => {
        if (search) {
          const q = search.toLowerCase()
          if (!stock.ticker.toLowerCase().includes(q) && !stock.name.toLowerCase().includes(q)) return false
        }
        if (sectorFilter !== 'all' && stock.sector !== sectorFilter) return false
        if (countryFilter !== 'all' && stock.country !== countryFilter) return false
        if (gradeFilter !== 'all' && score.grade !== gradeFilter) return false
        if (undervaluedOnly && score.grade !== 'A' && score.grade !== 'B') return false
        return true
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'score': return b.score.total - a.score.total
          case 'pe': return a.stock.pe - b.stock.pe
          case 'roe': return b.stock.roe - a.stock.roe
          case 'analystUpside': return b.stock.analystUpside - a.stock.analystUpside
          case 'dividendYield': return b.stock.dividendYield - a.stock.dividendYield
          default: return 0
        }
      })
  }, [scored, search, sectorFilter, countryFilter, gradeFilter, sortBy, undervaluedOnly])

  const toggleExpand = (ticker: string) => {
    setExpandedTicker((prev) => (prev === ticker ? null : ticker))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-green-600/20 border border-green-500/30 flex items-center justify-center shrink-0">
            <TrendingDown size={20} className="text-green-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white">Valeurs Sous-Évaluées</h1>
            <p className="text-slate-400 text-sm">Screening de 20 valeurs sur la base de critères fondamentaux : P/E, ROE, marges, dette. Un score A indique une action potentiellement sous-évaluée selon les modèles Graham et DCF. Ce n'est pas un conseil en investissement.</p>
          </div>
        </div>
        <button
          onClick={refreshAll}
          disabled={liveLoading || fundamentalsLoading}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0 sm:ml-auto"
        >
          <RefreshCw size={12} className={(liveLoading || fundamentalsLoading) ? 'animate-spin' : ''} />
          {lastUpdated
            ? `Cours & fondamentaux · ${lastUpdated.toLocaleTimeString('fr-FR', { timeStyle: 'short' })}`
            : (liveLoading || fundamentalsLoading) ? 'Chargement…' : 'Actualiser'}
        </button>
      </div>

      {/* Top Picks */}
      {topPicks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Meilleurs Rapports Qualité/Prix</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topPicks.map(({ stock, score }) => (
              <TopPickCard key={stock.ticker} stock={stock} score={score} />
            ))}
          </div>
        </div>
      )}

      {/* Grade legend */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info size={14} className="text-slate-400" />
          <span className="text-slate-400 text-xs font-medium">Légende des notes</span>
        </div>
        <GradeLegend />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher ticker / nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Tous secteurs</option>
            {sectors.filter((s) => s !== 'all').map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Tous pays</option>
            {countries.filter((c) => c !== 'all').map((c) => (
              <option key={c} value={c}>{COUNTRY_FLAGS[c] || ''} {c}</option>
            ))}
          </select>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value as GradeFilter)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Toutes notes</option>
            {(['A', 'B', 'C', 'D', 'F'] as const).map((g) => (
              <option key={g} value={g}>Note {g}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="score">Trier: Score</option>
            <option value="pe">Trier: P/E</option>
            <option value="roe">Trier: ROE</option>
            <option value="analystUpside">Trier: Potentiel Analyste</option>
            <option value="dividendYield">Trier: Dividende</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={undervaluedOnly}
              onChange={(e) => setUndervaluedOnly(e.target.checked)}
              className="rounded accent-green-500"
            />
            Sous-évalués seulement
          </label>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {filtered.map(({ stock, score }) => (
          <MobileStockCard
            key={stock.ticker}
            stock={stock}
            score={score}
            isExpanded={expandedTicker === stock.ticker}
            onToggle={() => toggleExpand(stock.ticker)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500 rounded-xl border border-slate-700 bg-slate-800">
            Aucune action correspondant aux filtres sélectionnés.
          </div>
        )}
      </div>

      {/* Table — desktop */}
      <div className="hidden lg:block rounded-xl border border-slate-700 bg-slate-800 overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Ticker</th>
              <th className="text-right px-4 py-3 text-slate-400 font-medium">Prix / Cible</th>
              <th className="text-center px-4 py-3 text-slate-400 font-medium">Note</th>
              <th className="text-right px-4 py-3 text-slate-400 font-medium">P/E vs Sect.</th>
              <th className="text-right px-4 py-3 text-slate-400 font-medium">P/B</th>
              <th className="text-right px-4 py-3 text-slate-400 font-medium">ROE %</th>
              <th className="text-right px-4 py-3 text-slate-400 font-medium">Marge Nette</th>
              <th className="text-right px-4 py-3 text-slate-400 font-medium">Crois. BPA</th>
              <th className="text-right px-4 py-3 text-slate-400 font-medium">Dividende</th>
              <th className="text-right px-4 py-3 text-slate-400 font-medium">Graham</th>
              <th className="text-right px-4 py-3 text-slate-400 font-medium">Upside Anal.</th>
              <th className="text-center px-2 py-3 text-slate-400 font-medium">Détail</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ stock, score }) => {
              const isExpanded = expandedTicker === stock.ticker
              const peBelowSector = stock.pe < stock.sectorPE
              const grahamDiscount = ((stock.grahamValue - stock.currentPrice) / stock.currentPrice * 100)

              return (
                <>
                  <tr
                    key={stock.ticker}
                    className={`border-b border-slate-700/50 hover:bg-slate-750 transition-colors ${isExpanded ? 'bg-slate-800/80' : ''}`}
                  >
                    {/* Ticker */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-accent/80">{stock.ticker.slice(0, 2)}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-white">{stock.ticker}</span>
                            <span>{COUNTRY_FLAGS[stock.country] || ''}</span>
                          </div>
                          <div className="text-xs text-slate-400 truncate max-w-[120px]">{stock.name}</div>
                        </div>
                      </div>
                    </td>

                    {/* Price / Target */}
                    <td className="px-4 py-3 text-right">
                      <div className="text-white font-medium">{stock.currentPrice.toFixed(2)} {stock.currency}</div>
                      <div className="text-xs text-slate-400">→ {stock.analystTarget.toFixed(2)}</div>
                    </td>

                    {/* Grade badge */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${gradeStyle(score.grade)}`}>
                          {score.grade}
                        </span>
                        <span className="text-xs text-slate-500">{score.total}/100</span>
                      </div>
                    </td>

                    {/* P/E vs sector */}
                    <td className="px-4 py-3 text-right">
                      <div className={`font-medium ${peBelowSector ? 'text-green-400' : 'text-red-400'}`}>
                        {stock.pe.toFixed(1)}x
                      </div>
                      <div className="text-xs text-slate-500">Sect: {stock.sectorPE.toFixed(1)}x</div>
                    </td>

                    {/* P/B */}
                    <td className="px-4 py-3 text-right">
                      <div className={`font-medium ${stock.pb < stock.sectorPB ? 'text-green-400' : 'text-slate-300'}`}>
                        {stock.pb.toFixed(1)}x
                      </div>
                    </td>

                    {/* ROE */}
                    <td className="px-4 py-3 text-right">
                      <div className={`font-medium ${stock.roe >= 20 ? 'text-green-400' : stock.roe >= 10 ? 'text-slate-300' : 'text-red-400'}`}>
                        {stock.roe.toFixed(1)}%
                      </div>
                    </td>

                    {/* Net margin */}
                    <td className="px-4 py-3 text-right">
                      <div className={`font-medium ${stock.netMargin >= 20 ? 'text-green-400' : stock.netMargin >= 10 ? 'text-slate-300' : 'text-orange-400'}`}>
                        {stock.netMargin.toFixed(1)}%
                      </div>
                    </td>

                    {/* EPS growth */}
                    <td className="px-4 py-3 text-right">
                      <div className={`font-medium ${stock.epsGrowthYoY >= 10 ? 'text-green-400' : stock.epsGrowthYoY >= 0 ? 'text-slate-300' : 'text-red-400'}`}>
                        {stock.epsGrowthYoY >= 0 ? '+' : ''}{stock.epsGrowthYoY.toFixed(1)}%
                      </div>
                    </td>

                    {/* Dividend */}
                    <td className="px-4 py-3 text-right">
                      <div className={`font-medium ${stock.dividendYield >= 4 ? 'text-green-400' : 'text-slate-300'}`}>
                        {stock.dividendYield.toFixed(1)}%
                      </div>
                    </td>

                    {/* Graham */}
                    <td className="px-4 py-3 text-right">
                      <div className="text-slate-300">{stock.grahamValue.toFixed(0)} {stock.currency}</div>
                      <div className={`text-xs ${grahamDiscount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {grahamDiscount > 0 ? '+' : ''}{grahamDiscount.toFixed(0)}%
                      </div>
                    </td>

                    {/* Analyst upside */}
                    <td className="px-4 py-3 text-right">
                      <div className={`font-medium ${stock.analystUpside >= 20 ? 'text-green-400' : stock.analystUpside >= 10 ? 'text-slate-300' : 'text-red-400'}`}>
                        +{stock.analystUpside.toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-500">{stock.numAnalysts} analys.</div>
                    </td>

                    {/* Expand button */}
                    <td className="px-2 py-3 text-center">
                      <button
                        onClick={() => toggleExpand(stock.ticker)}
                        className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr key={`${stock.ticker}-expanded`} className="bg-slate-800/50 border-b border-slate-700/50">
                      <ExpandedRow stock={stock} score={score} />
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Aucune action correspondant aux filtres sélectionnés.
          </div>
        )}
      </div>

      {/* Methodology note */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Info size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-300">Méthodologie de Scoring</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Le score total (0-100) est composé de quatre catégories de 25 points chacune. <strong className="text-slate-400">Valorisation</strong> :
          compare le P/E et P/B aux moyennes sectorielles, l'EV/EBITDA et le potentiel des analystes.
          <strong className="text-slate-400"> Rentabilité</strong> : évalue le ROE, ROIC et les marges opérationnelles.
          <strong className="text-slate-400"> Croissance</strong> : mesure la progression du BPA sur 1 an et 5 ans (TCAM) ainsi que la croissance du chiffre d'affaires.
          <strong className="text-slate-400"> Santé Financière</strong> : apprécie l'endettement, la liquidité et la couverture des intérêts.
          La <strong className="text-slate-400">Valeur Graham</strong> correspond à √(22,5 × BPA × VCA), méthode classique de l'investissement dans la valeur.
          Le <strong className="text-slate-400">DCF</strong> est une estimation simplifiée basée sur les flux de trésorerie projetés à 10 ans (croissance 5%, actualisation 9%).
          Les métriques (P/E, ROE, marges, dette, cibles analystes) proviennent de Yahoo Finance en temps réel ; en l'absence de donnée live pour un champ, une valeur de référence est utilisée. Ces données sont fournies à titre informatif et <em>ne constituent pas un conseil en investissement</em>.
        </p>
      </div>
      <Sources sources={[
        { label: 'Graham Number — Investopedia', url: 'https://www.investopedia.com/terms/g/graham-number.asp', description: 'Définition et calcul du nombre de Graham' },
        { label: 'DCF Valuation — Investopedia', url: 'https://www.investopedia.com/terms/d/dcf.asp', description: 'Méthode d\'actualisation des flux de trésorerie' },
        { label: 'Screener fondamental — Finviz', url: 'https://finviz.com/screener.ashx?v=111&f=fa_pe_u20,fa_roe_o15', description: 'Screener actions sous-évaluées (P/E < 20, ROE > 15%)' },
        { label: 'Ratios financiers — Macrotrends', url: 'https://www.macrotrends.net/', description: 'Historique des ratios P/E, P/B, marges par entreprise' },
        { label: 'P/E & P/B par secteur — Damodaran NYU', url: 'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/pedata.html', description: 'Ratios de valorisation moyens par secteur (A. Damodaran, NYU)' },
      ]} />
    </div>
  )
}

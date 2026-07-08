import { useEffect, useMemo, useState } from 'react'
import { usePortfolioStore } from '../store/portfolioStore'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { AlertTriangle, Shield, TrendingDown, Activity, RefreshCw } from 'lucide-react'
import { useLiveQuotes } from '../hooks/useLiveQuotes'
import { getHistory, PricePoint } from '../services/priceHistory'
import Sources from './Sources'

const BENCHMARK_TICKER = '^GSPC'
const RISK_FREE_RATE = 0.03 // annualised, used for Sharpe — ~current short-term T-bill yield

function corrColor(v: number): string {
  if (v >= 0.999) return 'bg-accent text-white'
  if (v >= 0.8) return 'bg-red-500/30 text-red-300'
  if (v >= 0.6) return 'bg-orange-500/20 text-orange-300'
  if (v >= 0.4) return 'bg-yellow-500/15 text-yellow-300'
  return 'bg-green-500/15 text-green-300'
}

function stdev(xs: number[]): number {
  if (xs.length < 2) return 0
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length
  const variance = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length - 1)
  return Math.sqrt(variance)
}

function pearsonCorrelation(a: number[], b: number[]): number | null {
  if (a.length !== b.length || a.length < 2) return null
  const meanA = a.reduce((s, v) => s + v, 0) / a.length
  const meanB = b.reduce((s, v) => s + v, 0) / b.length
  let cov = 0, varA = 0, varB = 0
  for (let i = 0; i < a.length; i++) {
    const da = a[i] - meanA, db = b[i] - meanB
    cov += da * db; varA += da * da; varB += db * db
  }
  if (varA === 0 || varB === 0) return null
  return cov / Math.sqrt(varA * varB)
}

function toReturns(points: PricePoint[]): { ts: number; r: number }[] {
  const sorted = [...points].sort((a, b) => a.ts - b.ts)
  const out: { ts: number; r: number }[] = []
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].price
    if (prev > 0) out.push({ ts: sorted[i].ts, r: (sorted[i].price - prev) / prev })
  }
  return out
}

// Align a series to a set of reference timestamps by nearest prior point —
// used to line up benchmark and per-position histories, which are recorded
// at different, irregular moments (whenever the user refreshes prices).
function nearestValueAt(sorted: PricePoint[], ts: number): number | null {
  let best: PricePoint | null = null
  for (const p of sorted) {
    if (p.ts <= ts && (!best || p.ts > best.ts)) best = p
  }
  return best ? best.price : null
}

export default function RiskAnalysis() {
  const positions = usePortfolioStore((s) => s.positions)
  const tickers = positions.map((p) => p.ticker)
  const { quotes: liveQuotes, loading, refresh, lastUpdated } = useLiveQuotes(tickers)

  const [benchmark, setBenchmark] = useState<PricePoint[]>([])
  const [benchLoading, setBenchLoading] = useState(false)

  const loadBenchmark = async () => {
    setBenchLoading(true)
    try {
      const res = await fetch(`/api/quote?ticker=${encodeURIComponent(BENCHMARK_TICKER)}&range=6mo&interval=1d`)
      if (res.ok) {
        const data = await res.json()
        const result = data?.chart?.result?.[0]
        const ts: number[] = result?.timestamp ?? []
        const closes: number[] = result?.indicators?.quote?.[0]?.close ?? []
        const points = ts
          .map((t, i) => ({ ts: t * 1000, price: closes[i] }))
          .filter((p) => typeof p.price === 'number')
        setBenchmark(points)
      }
    } catch { /* leave empty — beta will be unavailable */ }
    setBenchLoading(false)
  }

  useEffect(() => { loadBenchmark() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toEur = (amount: number, currency: string) => currency === 'USD' ? amount / 1.08 : amount

  const totalValue = positions.reduce((s, p) => {
    const live = liveQuotes.get(p.ticker)
    return s + toEur(p.quantity * (live ? live.price : p.currentPrice), p.currency)
  }, 0)
  const totalCost = positions.reduce((s, p) => s + toEur(p.quantity * p.purchasePrice, p.currency), 0)

  // Real portfolio value history — union of every position's recorded price
  // points, forward-filling each ticker's last known price at each timestamp.
  // Same construction as the Dashboard chart, so the two stay consistent.
  const portfolioSeries = useMemo(() => {
    const allTs = new Set<number>()
    positions.forEach((p) => getHistory(p.ticker).forEach((pt) => allTs.add(pt.ts)))
    if (allTs.size < 3) return []
    const sortedTs = Array.from(allTs).sort((a, b) => a - b)
    return sortedTs.map((ts) => {
      const value = positions.reduce((sum, p) => {
        const hist = getHistory(p.ticker).sort((a, b) => a.ts - b.ts)
        const last = hist.filter((pt) => pt.ts <= ts).slice(-1)[0]
        const price = last ? last.price : p.purchasePrice
        return sum + toEur(p.quantity * price, p.currency)
      }, 0)
      return { ts, value }
    })
  }, [positions])

  const hasEnoughHistory = portfolioSeries.length >= 3

  const drawdownData = useMemo(() => {
    if (!hasEnoughHistory) return []
    let runningMax = -Infinity
    return portfolioSeries.map((pt) => {
      runningMax = Math.max(runningMax, pt.value)
      const drawdown = runningMax > 0 ? ((pt.value / runningMax - 1) * 100) : 0
      return { ts: pt.ts, date: new Date(pt.ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), value: pt.value, drawdown }
    })
  }, [portfolioSeries, hasEnoughHistory])

  const portfolioReturns = useMemo(() => {
    if (!hasEnoughHistory) return []
    const out: number[] = []
    for (let i = 1; i < portfolioSeries.length; i++) {
      const prev = portfolioSeries[i - 1].value
      if (prev > 0) out.push((portfolioSeries[i].value - prev) / prev)
    }
    return out
  }, [portfolioSeries, hasEnoughHistory])

  // Annualisation factor assumes roughly daily observations — a rough but
  // real estimate that sharpens as more price history accumulates.
  const volatility = portfolioReturns.length >= 2 ? stdev(portfolioReturns) * Math.sqrt(252) * 100 : null
  const meanReturn = portfolioReturns.length > 0 ? portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length : null
  const annualisedReturn = meanReturn != null ? meanReturn * 252 : null
  const sharpe = volatility != null && volatility > 0 && annualisedReturn != null
    ? (annualisedReturn - RISK_FREE_RATE) / (volatility / 100)
    : null

  const beta = useMemo(() => {
    if (!hasEnoughHistory || benchmark.length < 3) return null
    const sortedBench = [...benchmark].sort((a, b) => a.ts - b.ts)
    const benchAtPortfolioTs = portfolioSeries.map((pt) => nearestValueAt(sortedBench, pt.ts))
    const benchReturns: number[] = []
    const portReturns: number[] = []
    for (let i = 1; i < portfolioSeries.length; i++) {
      const prevB = benchAtPortfolioTs[i - 1], curB = benchAtPortfolioTs[i]
      const prevP = portfolioSeries[i - 1].value, curP = portfolioSeries[i].value
      if (prevB != null && curB != null && prevB > 0 && prevP > 0) {
        benchReturns.push((curB - prevB) / prevB)
        portReturns.push((curP - prevP) / prevP)
      }
    }
    if (benchReturns.length < 3) return null
    const meanB = benchReturns.reduce((a, b) => a + b, 0) / benchReturns.length
    const varB = benchReturns.reduce((a, b) => a + (b - meanB) ** 2, 0) / benchReturns.length
    if (varB === 0) return null
    const meanP = portReturns.reduce((a, b) => a + b, 0) / portReturns.length
    let cov = 0
    for (let i = 0; i < benchReturns.length; i++) cov += (benchReturns[i] - meanB) * (portReturns[i] - meanP)
    cov /= benchReturns.length
    return cov / varB
  }, [portfolioSeries, benchmark, hasEnoughHistory])

  const maxDrawdown = drawdownData.length > 0 ? Math.min(...drawdownData.map((d) => d.drawdown)) : null

  const dataReady = hasEnoughHistory
  const riskCards = [
    {
      label: 'Beta du Portefeuille',
      value: beta != null ? beta.toFixed(2) : '—',
      sub: 'vs S&P 500',
      icon: <Activity size={20} className="text-accent/80" />,
      desc: beta == null ? "Pas assez d'historique commun avec le benchmark" : beta > 1.2 ? 'Portefeuille plus volatil que le marché' : 'Corrélation modérée avec le marché',
      color: beta != null && beta > 1.2 ? 'text-yellow-400' : 'text-white',
    },
    {
      label: 'Volatilité Annualisée',
      value: volatility != null ? `${volatility.toFixed(1)}%` : '—',
      sub: 'Écart-type des rendements réels',
      icon: <TrendingDown size={20} className="text-yellow-400" />,
      desc: volatility == null ? "Historique de prix insuffisant" : volatility < 15 ? 'Volatilité dans la norme pour un portefeuille actions' : 'Volatilité élevée — profil risqué',
      color: volatility != null && volatility < 15 ? 'text-white' : 'text-yellow-400',
    },
    {
      label: 'Ratio de Sharpe',
      value: sharpe != null ? sharpe.toFixed(2) : '—',
      sub: 'Rendement/risque (taux sans risque 3%)',
      icon: <Shield size={20} className="text-green-400" />,
      desc: sharpe == null ? "Historique insuffisant" : sharpe > 1 ? 'Excellent rendement ajusté au risque' : 'Rendement insuffisant pour le risque pris',
      color: sharpe != null && sharpe > 1 ? 'text-green-400' : 'text-red-400',
    },
    {
      label: 'Max Drawdown',
      value: maxDrawdown != null ? `${maxDrawdown.toFixed(1)}%` : '—',
      sub: 'Perte max réelle depuis un pic',
      icon: <AlertTriangle size={20} className="text-red-400" />,
      desc: maxDrawdown == null ? "Historique insuffisant" : 'Calculé depuis la valeur réelle du portefeuille dans le temps',
      color: 'text-red-400',
    },
  ]

  // Real pairwise correlation between the portfolio's own positions, from
  // each ticker's recorded price history — replaces any fixed reference set.
  const correlation = useMemo(() => {
    const series = positions.map((p) => ({ ticker: p.ticker, returns: toReturns(getHistory(p.ticker)) }))
      .filter((s) => s.returns.length >= 2)
    const matrix: Record<string, Record<string, number | null>> = {}
    series.forEach((a) => {
      matrix[a.ticker] = {}
      series.forEach((b) => {
        if (a.ticker === b.ticker) { matrix[a.ticker][b.ticker] = 1; return }
        // Align on overlapping timestamps between the two return series
        const bMap = new Map(b.returns.map((r) => [r.ts, r.r]))
        const pairsA: number[] = [], pairsB: number[] = []
        a.returns.forEach((r) => { if (bMap.has(r.ts)) { pairsA.push(r.r); pairsB.push(bMap.get(r.ts)!) } })
        matrix[a.ticker][b.ticker] = pearsonCorrelation(pairsA, pairsB)
      })
    })
    return { keys: series.map((s) => s.ticker), matrix }
  }, [positions])

  // Dynamic diversification observations computed from the actual portfolio
  // composition — sector concentration, bond/defensive presence, ETF share.
  const tips = useMemo(() => {
    const out: { status: 'good' | 'warn'; text: string }[] = []
    if (positions.length === 0) return out
    const bySector = new Map<string, number>()
    let etfValue = 0, defensiveValue = 0, total = 0
    positions.forEach((p) => {
      const live = liveQuotes.get(p.ticker)
      const v = toEur(p.quantity * (live ? live.price : p.currentPrice), p.currency)
      total += v
      bySector.set(p.sector, (bySector.get(p.sector) ?? 0) + v)
      const nameLower = (p.name + ' ' + p.ticker).toLowerCase()
      if (nameLower.includes('etf')) etfValue += v
      if (nameLower.includes('court terme') || nameLower.includes('obligation') || nameLower.includes('govies') || nameLower.includes('bond') || p.sector.toLowerCase().includes('oblig')) defensiveValue += v
    })
    if (total === 0) return out
    const topSector = Array.from(bySector.entries()).sort((a, b) => b[1] - a[1])[0]
    const topPct = (topSector[1] / total) * 100
    if (topPct >= 40) out.push({ status: 'warn', text: `Concentration sectorielle élevée : ${topSector[0]} représente ${topPct.toFixed(0)}% du portefeuille. Envisagez de diversifier.` })
    else out.push({ status: 'good', text: `Bonne répartition sectorielle — le secteur le plus pondéré (${topSector[0]}) représente ${topPct.toFixed(0)}% du portefeuille.` })

    const etfPct = (etfValue / total) * 100
    if (etfPct > 0) out.push({ status: 'good', text: `${etfPct.toFixed(0)}% du portefeuille est investi via des ETF, ce qui réduit le risque idiosyncratique par rapport aux actions individuelles.` })

    const defensivePct = (defensiveValue / total) * 100
    if (defensivePct === 0) out.push({ status: 'warn', text: "Aucun actif obligataire ou monétaire détecté — le portefeuille est 100% exposé au risque actions." })
    else out.push({ status: 'good', text: `${defensivePct.toFixed(0)}% du portefeuille est alloué à des actifs défensifs (obligations / monétaire).` })

    const countries = new Set(positions.map((p) => p.currency))
    if (countries.size > 1) out.push({ status: 'good', text: `Exposition multi-devises (${Array.from(countries).join(', ')}) — diversification géographique.` })

    if (sharpe != null) {
      out.push(sharpe > 1
        ? { status: 'good', text: 'Ratio de Sharpe > 1 : le rendement historique compense correctement le risque pris.' }
        : { status: 'warn', text: 'Ratio de Sharpe < 1 : le rendement historique ne compense pas pleinement le risque pris.' })
    }
    return out
  }, [positions, liveQuotes, sharpe]) // eslint-disable-line react-hooks/exhaustive-deps

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Analyse de Risque</h1>
          <p className="text-slate-400 text-sm mt-1">Beta, volatilité, Sharpe et drawdown calculés depuis l'historique réel des cours de votre portefeuille (Yahoo Finance). Un Beta &gt; 1 signifie que vous amplifiez les mouvements du marché. Ces métriques gagnent en précision à mesure que l'historique de prix s'accumule.</p>
        </div>
        <button
          onClick={() => { refresh(); loadBenchmark() }}
          disabled={loading || benchLoading}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={12} className={(loading || benchLoading) ? 'animate-spin' : ''} />
          {lastUpdated ? `Temps réel · ${lastUpdated.toLocaleTimeString('fr-FR', { timeStyle: 'short' })}` : 'Actualiser'}
        </button>
      </div>

      {!dataReady && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-300">
          Historique de prix insuffisant pour calculer beta, volatilité, Sharpe et drawdown. Ces métriques apparaissent après quelques actualisations de cours dans l'onglet Positions (au moins 3 points par titre).
        </div>
      )}

      {/* Risk metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {riskCards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400">{c.label}</span>
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                {c.icon}
              </div>
            </div>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            <div className="text-slate-500 text-xs mt-0.5">{c.sub}</div>
            <div className="text-slate-400 text-xs mt-2 leading-relaxed">{c.desc}</div>
          </div>
        ))}
      </div>

      {/* Drawdown chart */}
      {dataReady && (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <h2 className="text-base font-semibold text-white mb-1">Drawdown du Portefeuille</h2>
          <p className="text-slate-400 text-xs mb-4">Calculé depuis la valeur réelle du portefeuille — {drawdownData.length} points d'historique</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={drawdownData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={false}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={{ background: 'var(--tooltip-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', fontSize: '12px', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }}
                formatter={(v: number) => [`${v.toFixed(2)}%`, 'Drawdown']}
              />
              <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
              <ReferenceLine y={-10} stroke="#f87171" strokeDasharray="3 3" label={{ value: '-10%', fill: '#f87171', fontSize: 10, position: 'right' }} />
              <Line
                type="monotone"
                dataKey="drawdown"
                stroke="#f87171"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Correlation matrix */}
      {correlation.keys.length >= 2 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <h2 className="text-base font-semibold text-white mb-1">Matrice de Corrélation</h2>
          <p className="text-slate-400 text-xs mb-4">Corrélation réelle entre vos positions, calculée depuis leur historique de cours</p>
          <div className="overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-slate-400 font-normal text-left w-16"></th>
                  {correlation.keys.map((k) => (
                    <th key={k} className="px-3 py-2 text-slate-400 font-semibold text-center w-16">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {correlation.keys.map((rowKey) => (
                  <tr key={rowKey}>
                    <td className="px-3 py-2 text-slate-400 font-semibold">{rowKey}</td>
                    {correlation.keys.map((colKey) => {
                      const v = correlation.matrix[rowKey][colKey]
                      return (
                        <td key={colKey} className="px-1 py-1 text-center">
                          {v != null ? (
                            <div className={`rounded px-2 py-1 font-mono ${corrColor(v)}`}>{v.toFixed(2)}</div>
                          ) : (
                            <div className="rounded px-2 py-1 font-mono bg-slate-700/40 text-slate-600">—</div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-700">
            {[
              { color: 'bg-red-500/30', label: 'Très corrélé (>= 0.8)' },
              { color: 'bg-orange-500/20', label: 'Corrélé (0.6–0.8)' },
              { color: 'bg-yellow-500/15', label: 'Faiblement corrélé (0.4–0.6)' },
              { color: 'bg-green-500/15', label: 'Peu corrélé (< 0.4)' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${color}`} />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 text-sm text-slate-400">
          Ajoutez au moins 2 positions avec un historique de cours pour afficher la matrice de corrélation.
        </div>
      )}

      {/* Tips */}
      {tips.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <h2 className="text-base font-semibold text-white mb-4">Conseils de Diversification</h2>
          <div className="space-y-3">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${tip.status === 'good' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <p className="text-sm text-slate-300 leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio value summary */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        <h2 className="text-base font-semibold text-white mb-3">Résumé du Portefeuille</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Valeur totale', value: fmt(totalValue) },
            { label: 'Coût total', value: fmt(totalCost) },
            { label: 'P&L latent', value: `${totalValue - totalCost >= 0 ? '+' : ''}${fmt(totalValue - totalCost)}` },
            { label: 'Nb positions', value: positions.length.toString() },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-xs text-slate-400 mb-1">{item.label}</div>
              <div className="text-lg font-bold text-white">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
      <Sources sources={[
        { label: 'Beta & Volatilité — Investopedia', url: 'https://www.investopedia.com/terms/b/beta.asp', description: 'Définition du Beta et mesure de risque' },
        { label: 'Ratio de Sharpe — Investopedia', url: 'https://www.investopedia.com/terms/s/sharperatio.asp', description: 'Calcul et interprétation du ratio de Sharpe' },
        { label: 'Corrélations — MSCI', url: 'https://www.msci.com/research-and-insights/visualizing-investment-data/asset-class-correlations', description: 'Corrélations entre classes d\'actifs' },
        { label: 'Portfolio Visualizer', url: 'https://www.portfoliovisualizer.com/', description: 'Backtesting et analyse de risque de portefeuille' },
        { label: 'Max Drawdown — Investopedia', url: 'https://www.investopedia.com/terms/m/maximum-drawdown-mdd.asp', description: 'Définition et calcul du drawdown maximum' },
      ]} />
    </div>
  )
}

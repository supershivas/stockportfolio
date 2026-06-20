import { useState, useEffect } from 'react'
import { usePortfolioStore } from '../store/portfolioStore'
import { TrendingUp, TrendingDown, Euro, Percent, RefreshCw, WifiOff } from 'lucide-react'
import Sources from './Sources'
import MarketBulletin from './MarketBulletin'
import {
  LineChart, Line, YAxis, XAxis, ResponsiveContainer, Tooltip,
  AreaChart, Area, ReferenceLine,
} from 'recharts'
import { useLiveQuotes } from '../hooks/useLiveQuotes'
import { INDEX_TICKERS, fetchEurUsdRate } from '../services/marketData'
import { getHistory } from '../services/priceHistory'

const SPARK_SHAPES: Record<string, number[]> = {
  '^GSPC':   [0.92, 0.94, 0.93, 0.96, 0.97, 0.96, 0.98, 1],
  '^IXIC':   [0.91, 0.93, 0.92, 0.95, 0.97, 0.96, 0.99, 1],
  '^FCHI':   [1.01, 1.00, 0.99, 0.98, 0.99, 1.00, 0.99, 1],
  'IWDA.AS': [0.93, 0.94, 0.93, 0.96, 0.97, 0.97, 0.99, 1],
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

export default function Dashboard() {
  const positions = usePortfolioStore((s) => s.positions)
  const [eurUsd, setEurUsd] = useState(1.08)
  useEffect(() => { fetchEurUsdRate().then(setEurUsd) }, [])

  const toEur = (amount: number, currency: string) =>
    currency === 'USD' ? amount / eurUsd : amount

  const indexSymbols = INDEX_TICKERS.map((t) => t.symbol)
  const portfolioTickers = positions.map((p) => p.ticker)
  const { quotes: indexQuotes, loading: indexLoading, refresh: refreshIndexes } = useLiveQuotes(indexSymbols)
  const { quotes: portfolioQuotes, refresh: refreshPortfolio } = useLiveQuotes(portfolioTickers)

  const totalCostEur = positions.reduce((sum, p) => sum + toEur(p.quantity * p.purchasePrice, p.currency), 0)
  const staticValueEur = positions.reduce((sum, p) => sum + toEur(p.quantity * p.currentPrice, p.currency), 0)
  const liveValueEur = positions.reduce((sum, p) => {
    const live = portfolioQuotes.get(p.ticker)
    return sum + toEur(p.quantity * (live ? live.price : p.currentPrice), p.currency)
  }, 0)
  const hasLiveData = portfolioQuotes.size > 0
  const displayValue = hasLiveData ? liveValueEur : staticValueEur
  const totalPnLEur = displayValue - totalCostEur
  const totalReturn = totalCostEur > 0 ? (totalPnLEur / totalCostEur) * 100 : 0

  const dayChangeEur = positions.reduce((sum, p) => {
    const live = portfolioQuotes.get(p.ticker)
    return sum + toEur(p.quantity * (live ? live.change : 0), p.currency)
  }, 0)

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

  // Build portfolio value history from per-ticker price histories
  const portfolioHistory: { date: string; value: number }[] = (() => {
    // Collect all unique timestamps across all tickers
    const allTs = new Set<number>()
    positions.forEach((p) => getHistory(p.ticker).forEach((pt) => allTs.add(pt.ts)))
    if (allTs.size < 2) return []

    const sorted = Array.from(allTs).sort((a, b) => a - b)

    return sorted.map((ts) => {
      // For each position, find the last known price at or before this timestamp
      const value = positions.reduce((sum, p) => {
        const hist = getHistory(p.ticker)
        const last = hist.filter((pt) => pt.ts <= ts).slice(-1)[0]
        const price = last ? last.price : p.purchasePrice
        return sum + toEur(p.quantity * price, p.currency)
      }, 0)
      return { date: formatDate(ts), value: Math.round(value) }
    })
  })()

  const histFirst = portfolioHistory[0]?.value ?? 0
  const histLast = portfolioHistory[portfolioHistory.length - 1]?.value ?? 0
  const histRising = histLast >= histFirst
  const histColor = histRising ? '#22c55e' : '#f87171'

  const top5 = [...positions]
    .sort((a, b) => toEur(b.quantity * b.currentPrice, b.currency) - toEur(a.quantity * a.currentPrice, a.currency))
    .slice(0, 5)

  const statCards = [
    {
      label: 'Valeur Totale',
      value: fmt(displayValue),
      icon: <Euro size={20} className="text-accent/80" />,
      sub: hasLiveData ? `Temps réel · EUR/USD ${eurUsd.toFixed(4)}` : 'Données locales',
      color: 'text-white',
      warning: !hasLiveData,
    },
    {
      label: 'Variation Jour',
      value: `${dayChangeEur >= 0 ? '+' : ''}${fmt(dayChangeEur)}`,
      icon: dayChangeEur >= 0 ? <TrendingUp size={20} className="text-green-400" /> : <TrendingDown size={20} className="text-red-400" />,
      sub: hasLiveData ? 'Données temps réel' : 'Pas de données live',
      color: dayChangeEur >= 0 ? 'text-green-400' : 'text-red-400',
      warning: !hasLiveData,
    },
    {
      label: 'P&L Total',
      value: `${totalPnLEur >= 0 ? '+' : ''}${fmt(totalPnLEur)}`,
      icon: totalPnLEur >= 0 ? <TrendingUp size={20} className="text-green-400" /> : <TrendingDown size={20} className="text-red-400" />,
      sub: "Depuis l'achat (en €)",
      color: totalPnLEur >= 0 ? 'text-green-400' : 'text-red-400',
      warning: false,
    },
    {
      label: 'Rendement',
      value: `${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%`,
      icon: <Percent size={20} className="text-accent/80" />,
      sub: 'Performance globale',
      color: totalReturn >= 0 ? 'text-green-400' : 'text-red-400',
      warning: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Vue d'ensemble de votre portefeuille en temps réel, actualités du jour et indices mondiaux.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── LEFT: market info ── */}
        <div className="xl:col-span-3 space-y-6">

          {/* Market bulletin */}
          <MarketBulletin />

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((c) => (
              <div key={c.label} className={`rounded-xl border bg-slate-800 p-4 ${c.warning ? 'border-yellow-500/40' : 'border-slate-700'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs">{c.label}</span>
                  <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center">
                    {c.warning ? <WifiOff size={15} className="text-yellow-500" /> : c.icon}
                  </div>
                </div>
                <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
                <div className={`text-xs mt-0.5 ${c.warning ? 'text-yellow-500' : 'text-slate-500'}`}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* World indices */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-white">Indices Mondiaux</h2>
              <button
                onClick={() => { refreshIndexes(); refreshPortfolio() }}
                disabled={indexLoading}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} className={indexLoading ? 'animate-spin' : ''} />
                {indexLoading ? 'Chargement…' : 'Actualiser'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {INDEX_TICKERS.map((idx) => {
                const live = indexQuotes.get(idx.symbol)
                const price = live ? live.price : idx.fallback
                const change = live ? live.changePercent : idx.changePercent
                const shape = SPARK_SHAPES[idx.symbol] || [0.95, 0.97, 0.96, 0.98, 0.99, 0.98, 0.99, 1]
                const sparkData = shape.map((r) => ({ v: +(price * r).toFixed(2) }))
                return (
                  <div key={idx.symbol} className="rounded-xl border border-slate-700 bg-slate-800 p-3">
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                          {idx.label}
                          {live && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                        </div>
                        <div className="text-lg font-bold text-white mt-0.5">
                          {price.toLocaleString('fr-FR')}
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        change >= 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                      }`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={40}>
                      <LineChart data={sparkData}>
                        <YAxis domain={['dataMin', 'dataMax']} hide />
                        <Line type="monotone" dataKey="v" stroke={change >= 0 ? '#22c55e' : '#f87171'} strokeWidth={2} dot={false} />
                        <Tooltip
                          contentStyle={{ background: 'var(--tooltip-bg)', border: 'none', borderRadius: '8px', fontSize: '11px', color: 'var(--text-primary)' }}
                          itemStyle={{ color: 'var(--text-primary)' }}
                          labelFormatter={() => ''}
                          formatter={(v: number) => [v.toLocaleString('fr-FR'), idx.label]}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT: portfolio ── */}
        <div className="xl:col-span-2 space-y-6">

          {/* Portfolio evolution chart */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-semibold text-white">Évolution du Portefeuille</h2>
              <span className={`text-sm font-semibold ${histRising ? 'text-green-400' : 'text-red-400'}`}>
                {fmt(displayValue)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              {totalPnLEur >= 0 ? '+' : ''}{fmt(totalPnLEur)} · {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}% depuis l'achat
            </p>
            {portfolioHistory.length >= 2 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={portfolioHistory} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={histColor} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={histColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={['dataMin - 500', 'dataMax + 500']} hide />
                  <Tooltip
                    contentStyle={{ background: 'var(--tooltip-bg)', border: 'none', borderRadius: '8px', fontSize: '11px', color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                    formatter={(v: number) => [fmt(v), 'Valeur']}
                  />
                  <Area type="monotone" dataKey="value" stroke={histColor} strokeWidth={2} fill="url(#portfolioGrad)" dot={false} activeDot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-slate-500 text-xs text-center px-4">
                La courbe apparaîtra après la 2e mise à jour des cours.
                <br />Cliquez « Actualiser » dans Positions ou modifiez un prix manuellement.
              </div>
            )}
          </div>

          {/* Top positions */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <h2 className="text-base font-semibold text-white mb-4">Principales Positions</h2>
            <div className="space-y-1">
              {top5.map((p) => {
                const val = toEur(p.quantity * p.currentPrice, p.currency)
                const pnl = (p.currentPrice - p.purchasePrice) / p.purchasePrice * 100
                return (
                  <div key={p.id} className="py-2 border-b border-slate-700/60 last:border-0">
                    <div className="flex items-center gap-2">
                      {/* Avatar */}
                      <div className="w-7 h-7 rounded bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-accent/80">{p.ticker.slice(0, 2)}</span>
                      </div>
                      {/* Name + sparkline */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white text-sm leading-none">{p.ticker}</span>
                          <span className="font-semibold text-white text-sm">{fmt(val)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-slate-500 text-xs truncate">{p.name}</span>
                          <span className={`text-xs shrink-0 ml-2 ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                          </span>
                        </div>
                        {/* Sparkline — gain net (price − purchasePrice) × qty */}
                        {(() => {
                          const hist = getHistory(p.ticker)
                          if (hist.length < 2) return (
                            <div className="h-8 flex items-center">
                              <div className="h-px w-full bg-slate-700" />
                            </div>
                          )
                          const sparkData = hist.map((pt) => ({ v: (pt.price - p.purchasePrice) * p.quantity }))
                          const lastGain = sparkData[sparkData.length - 1].v
                          const sparkColor = lastGain >= 0 ? '#22c55e' : '#f87171'
                          const minV = Math.min(...sparkData.map(d => d.v))
                          const maxV = Math.max(...sparkData.map(d => d.v))
                          const pad = Math.max(Math.abs(maxV - minV) * 0.1, 1)
                          return (
                            <ResponsiveContainer width="100%" height={32}>
                              <LineChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
                                <YAxis domain={[minV - pad, maxV + pad]} hide />
                                <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 2" strokeWidth={1} />
                                <Line type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <Sources sources={[
        { label: 'Yahoo Finance', url: 'https://finance.yahoo.com/', description: 'Cours boursiers et données de marché' },
        { label: 'S&P 500 — Macrotrends', url: 'https://www.macrotrends.net/2324/sp-500-historical-chart-data', description: 'Historique S&P 500' },
        { label: 'CAC 40 — Euronext', url: 'https://www.euronext.com/fr/products/indices/FR0003500008-XPAR', description: 'Composition et performance du CAC 40' },
        { label: 'MSCI World Index', url: 'https://www.msci.com/our-solutions/indexes/msci-world', description: 'Composition et performances MSCI World' },
        { label: 'Finnhub — Données temps réel', url: 'https://finnhub.io/', description: 'API de données boursières en temps réel' },
      ]} />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { usePortfolioStore } from '../store/portfolioStore'
import { TrendingUp, TrendingDown, Euro, Percent, RefreshCw, WifiOff } from 'lucide-react'
import Sources from './Sources'
import MarketBulletin from './MarketBulletin'
import {
  LineChart, Line, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { useLiveQuotes } from '../hooks/useLiveQuotes'
import { INDEX_TICKERS, fetchEurUsdRate } from '../services/marketData'

// Static sparklines (shape only — value from live data or fallback)
const SPARK_SHAPES: Record<string, number[]> = {
  '^GSPC':   [0.92, 0.94, 0.93, 0.96, 0.97, 0.96, 0.98, 1],
  '^IXIC':   [0.91, 0.93, 0.92, 0.95, 0.97, 0.96, 0.99, 1],
  '^FCHI':   [1.01, 1.00, 0.99, 0.98, 0.99, 1.00, 0.99, 1],
  'IWDA.AS': [0.93, 0.94, 0.93, 0.96, 0.97, 0.97, 0.99, 1],
}

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6']

export default function Dashboard() {
  const positions = usePortfolioStore((s) => s.positions)
  const [eurUsd, setEurUsd] = useState(1.08)
  useEffect(() => {
    fetchEurUsdRate().then(setEurUsd)
  }, [])

  const toEur = (amount: number, currency: string) =>
    currency === 'USD' ? amount / eurUsd : amount

  const indexSymbols = INDEX_TICKERS.map((t) => t.symbol)
  const portfolioTickers = positions.map((p) => p.ticker)
  const { quotes: indexQuotes, loading: indexLoading, refresh: refreshIndexes } = useLiveQuotes(indexSymbols)
  const { quotes: portfolioQuotes, refresh: refreshPortfolio } = useLiveQuotes(portfolioTickers)

  // All values in EUR — USD positions converted using live EUR/USD rate
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

  const sectorMap: Record<string, number> = {}
  positions.forEach((p) => {
    const val = toEur(p.quantity * p.currentPrice, p.currency)
    sectorMap[p.sector] = (sectorMap[p.sector] || 0) + val
  })
  const sectorData = Object.entries(sectorMap).map(([name, value]) => ({ name, value }))

  const top5 = [...positions]
    .sort((a, b) => toEur(b.quantity * b.currentPrice, b.currency) - toEur(a.quantity * a.currentPrice, a.currency))
    .slice(0, 5)

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

  const statCards = [
    {
      label: 'Valeur Totale',
      value: fmt(displayValue),
      icon: <Euro size={20} className="text-indigo-400" />,
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
      sub: 'Depuis l\'achat (en €)',
      color: totalPnLEur >= 0 ? 'text-green-400' : 'text-red-400',
      warning: false,
    },
    {
      label: 'Rendement',
      value: `${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%`,
      icon: <Percent size={20} className="text-indigo-400" />,
      sub: 'Performance globale',
      color: totalReturn >= 0 ? 'text-green-400' : 'text-red-400',
      warning: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Vue d'ensemble de votre portefeuille</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((c) => (
          <div key={c.label} className={`rounded-xl border bg-slate-800 p-5 ${c.warning ? 'border-yellow-500/40' : 'border-slate-700'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-sm">{c.label}</span>
              <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center">
                {c.warning ? <WifiOff size={20} className="text-yellow-500" /> : c.icon}
              </div>
            </div>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            <div className={`text-xs mt-1 ${c.warning ? 'text-yellow-500' : 'text-slate-500'}`}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Index cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Indices Mondiaux</h2>
          <button
            onClick={() => { refreshIndexes(); refreshPortfolio() }}
            disabled={indexLoading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={indexLoading ? 'animate-spin' : ''} />
            {indexLoading ? 'Chargement…' : 'Actualiser'}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {INDEX_TICKERS.map((idx) => {
            const live = indexQuotes.get(idx.symbol)
            const price = live ? live.price : idx.fallback
            const change = live ? live.changePercent : idx.changePercent
            const shape = SPARK_SHAPES[idx.symbol] || [0.95, 0.97, 0.96, 0.98, 0.99, 0.98, 0.99, 1]
            const sparkData = shape.map((r) => ({ v: +(price * r).toFixed(2) }))
            return (
              <div key={idx.symbol} className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                      {idx.label}
                      {live && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" title="Temps réel" />}
                    </div>
                    <div className="text-xl font-bold text-white mt-0.5">
                      {price.toLocaleString('fr-FR')}
                    </div>
                  </div>
                  <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                    change >= 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                  }`}>
                    {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={50}>
                  <LineChart data={sparkData}>
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <Line type="monotone" dataKey="v" stroke={change >= 0 ? '#22c55e' : '#f87171'} strokeWidth={2} dot={false} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#e2e8f0' }}
                      itemStyle={{ color: '#e2e8f0' }}
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

      {/* Bottom: table + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top holdings */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Top 5 Positions</h2>
          <div className="space-y-2">
            {top5.map((p) => {
              const val = toEur(p.quantity * p.currentPrice, p.currency)
              const pnl = (p.currentPrice - p.purchasePrice) / p.purchasePrice * 100
              return (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-indigo-400">{p.ticker.slice(0, 2)}</span>
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm">{p.ticker}</div>
                      <div className="text-slate-400 text-xs">{p.sector}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-white text-sm">{fmt(val)}</div>
                    <div className={`text-xs ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sector donut */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Allocation Sectorielle</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={sectorData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {sectorData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#e2e8f0' }}
                itemStyle={{ color: '#e2e8f0' }}
                formatter={(v: number) => [fmt(v), '']}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(val) => <span className="text-slate-300 text-xs">{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <MarketBulletin />
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

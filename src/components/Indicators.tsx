import { marketIndicators } from '../data/indicators'
import { JOSE_COMPONENTS, JOSE_SCORE, JOSE_HISTORY_2Y, JOSE_HISTORY_1Y, JOSE_HISTORY_30D, getJoseStatus } from '../data/joseIndex'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts'
import { TrendingUp, TrendingDown, Minus, RefreshCw, Info } from 'lucide-react'
import { useState } from 'react'
import { useLiveQuotes } from '../hooks/useLiveQuotes'
import { INDICATOR_TICKERS } from '../services/marketData'
import Sources from './Sources'

type JoseTimeframe = '30d' | '1y' | '2y'

function JoseIndexSection() {
  const [timeframe, setTimeframe] = useState<JoseTimeframe>('1y')
  const [showDetails, setShowDetails] = useState(false)
  const status = getJoseStatus(JOSE_SCORE)

  const historyMap: Record<JoseTimeframe, number[]> = {
    '30d': JOSE_HISTORY_30D,
    '1y': JOSE_HISTORY_1Y,
    '2y': JOSE_HISTORY_2Y,
  }
  const labelMap: Record<JoseTimeframe, string> = {
    '30d': '30 jours',
    '1y': '12 mois',
    '2y': '2 ans',
  }
  const history = historyMap[timeframe]
  // Build approximate timestamps: last point = now, step back by period
  const stepMs: Record<JoseTimeframe, number> = {
    '30d': 24 * 60 * 60 * 1000,           // 1 day
    '1y': 30 * 24 * 60 * 60 * 1000,       // ~1 month
    '2y': 7 * 24 * 60 * 60 * 1000,        // 1 week
  }
  const now = Date.now()
  const step = stepMs[timeframe]
  const chartData = history.map((v, i) => ({
    i,
    v,
    ts: now - (history.length - 1 - i) * step,
  }))
  const prev = history[history.length - 2] ?? JOSE_SCORE
  const delta = JOSE_SCORE - prev

  // Gauge arc: score 0-100 → angle -90 to 90 degrees (half circle)
  const angle = -90 + (JOSE_SCORE / 100) * 180
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const gx = 60 + 48 * Math.cos(toRad(angle))
  const gy = 60 + 48 * Math.sin(toRad(angle))

  return (
    <div className="rounded-xl border bg-slate-800 p-5 space-y-5" style={{ borderColor: status.color + '44' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-white">JoseIndex2000</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: status.bg, color: status.color }}>
              {status.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">{status.description} · Indice composite pondéré de 8 indicateurs macroéconomiques.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(['30d', '1y', '2y'] as JoseTimeframe[]).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className="text-xs px-2.5 py-1 rounded-md border transition-colors"
              style={{
                background: timeframe === tf ? 'var(--accent)' : 'transparent',
                borderColor: timeframe === tf ? 'var(--accent)' : 'rgb(71,85,105)',
                color: timeframe === tf ? '#fff' : 'rgb(148,163,184)',
              }}
            >
              {labelMap[tf]}
            </button>
          ))}
        </div>
      </div>

      {/* Score + gauge + chart */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Gauge */}
        <div className="flex flex-col items-center justify-center">
          <svg viewBox="0 0 120 70" className="w-36">
            {/* Track */}
            <path d="M12,60 A48,48 0 0,1 108,60" fill="none" stroke="rgb(51,65,85)" strokeWidth="8" strokeLinecap="round"/>
            {/* Colored fill up to score */}
            <path
              d={`M12,60 A48,48 0 ${angle > 0 ? 1 : 0},1 ${gx.toFixed(1)},${gy.toFixed(1)}`}
              fill="none"
              stroke={status.color}
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Needle */}
            <circle cx={gx.toFixed(1)} cy={gy.toFixed(1)} r="5" fill={status.color} />
            {/* Labels */}
            <text x="10" y="68" fontSize="7" fill="rgb(100,116,139)">0</text>
            <text x="56" y="16" fontSize="7" fill="rgb(100,116,139)" textAnchor="middle">50</text>
            <text x="104" y="68" fontSize="7" fill="rgb(100,116,139)" textAnchor="end">100</text>
          </svg>
          <div className="text-4xl font-bold mt-1" style={{ color: status.color }}>{JOSE_SCORE}</div>
          <div className="text-xs text-slate-400 mt-0.5">Score / 100</div>
          <div className={`text-xs mt-1 font-medium ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)} vs période préc.
          </div>
        </div>

        {/* Chart */}
        <div className="sm:col-span-2">
          <div className="text-xs text-slate-500 mb-1">Historique — {labelMap[timeframe]}</div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="joseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={status.color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={status.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <YAxis domain={[30, 80]} hide />
              <XAxis dataKey="ts" type="number" scale="time" domain={['dataMin', 'dataMax']} hide />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '6px', fontSize: '11px', padding: '4px 8px', color: '#f1f5f9' }}
                labelFormatter={(v: number) => new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                formatter={(v: number) => [`${v}`, 'JoseIndex2000']}
              />
              {/* Zone bands */}
              <Area type="monotone" dataKey="v" stroke={status.color} strokeWidth={2} fill="url(#joseGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          {/* Zone legend */}
          <div className="flex flex-wrap gap-3 mt-2">
            {[
              { label: 'Danger <35', color: '#f87171' },
              { label: 'Stress 35-50', color: '#fb923c' },
              { label: 'Neutre 50-65', color: '#facc15' },
              { label: 'Favorable 65-80', color: '#4ade80' },
              { label: 'Euphorie >80', color: '#f87171' },
            ].map(z => (
              <div key={z.label} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: z.color }} />
                <span className="text-[10px] text-slate-400">{z.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Components toggle */}
      <button
        onClick={() => setShowDetails(v => !v)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <Info size={12} />
        {showDetails ? 'Masquer' : 'Voir'} les {JOSE_COMPONENTS.length} composantes
      </button>

      {showDetails && (
        <div className="space-y-2">
          {JOSE_COMPONENTS.map(c => {
            const bar = Math.round(c.normalizedScore)
            const trend7Color = c.trend7d > 0 ? 'text-green-400' : c.trend7d < 0 ? 'text-red-400' : 'text-slate-400'
            const trend3mColor = c.trend3m > 0 ? 'text-green-400' : c.trend3m < 0 ? 'text-red-400' : 'text-slate-400'
            const trend1yColor = c.trend1y > 0 ? 'text-green-400' : c.trend1y < 0 ? 'text-red-400' : 'text-slate-400'
            const scoreColor = bar >= 65 ? '#4ade80' : bar >= 50 ? '#facc15' : bar >= 35 ? '#fb923c' : '#f87171'
            return (
              <div key={c.name} className="rounded-lg bg-slate-900/60 px-4 py-3 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-12 sm:col-span-4">
                  <div className="text-xs font-semibold text-white">{c.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{c.interpretation}</div>
                </div>
                <div className="col-span-4 sm:col-span-2 text-xs text-slate-300">
                  <span className="font-mono">{c.value} {c.unit}</span>
                </div>
                {/* Score bar */}
                <div className="col-span-8 sm:col-span-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${bar}%`, background: scoreColor }} />
                  </div>
                  <span className="text-[10px] font-semibold w-6 text-right" style={{ color: scoreColor }}>{bar}</span>
                  <span className="text-[10px] text-slate-500">({c.weight}%)</span>
                </div>
                {/* Trends */}
                <div className="col-span-12 sm:col-span-3 flex gap-3 text-[10px]">
                  <span className={trend7Color}>7j: {c.trend7d > 0 ? '+' : ''}{c.trend7d}%</span>
                  <span className={trend3mColor}>3m: {c.trend3m > 0 ? '+' : ''}{c.trend3m}%</span>
                  <span className={trend1yColor}>1a: {c.trend1y > 0 ? '+' : ''}{c.trend1y}%</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const STATUS_STYLES = {
  good: { border: 'border-green-500/30', dot: 'bg-green-400' },
  neutral: { border: 'border-slate-600', dot: 'bg-yellow-400' },
  bad: { border: 'border-red-500/30', dot: 'bg-red-400' },
}

export default function Indicators() {
  const now = new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
  const indicatorSymbols = INDICATOR_TICKERS.map((t) => t.symbol)
  const { quotes: liveIndicators, loading, refresh, lastUpdated } = useLiveQuotes(indicatorSymbols)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Indicateurs de Marché</h1>
          <p className="text-slate-400 text-sm mt-1">Le contexte macro influence directement votre portefeuille. VIX élevé = stress de marché, taux Fed en hausse = pression sur les actions growth, or en hausse = signal défensif. Connectez Finnhub pour les données en direct.</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Temps réel · {lastUpdated.toLocaleTimeString('fr-FR', { timeStyle: 'short' })}
            </div>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
          {!liveIndicators.size && (
            <div className="text-xs text-slate-500 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
              Données simulées · <span className="text-slate-400">{now}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {marketIndicators.map((ind) => {
          // Map static indicator names to live Finnhub symbols
          const liveSymbolMap: Record<string, string> = {
            'VIX': '^VIX', 'Or (Gold)': 'GC=F', 'Dollar Index': 'DX-Y.NYB',
          }
          const liveSymbol = liveSymbolMap[ind.name]
          const liveData = liveSymbol ? liveIndicators.get(liveSymbol) : undefined
          const displayValue = liveData ? liveData.price : ind.value
          const displayChange = liveData ? liveData.changePercent : ind.change
          const styles = STATUS_STYLES[ind.status]
          const nowMs = Date.now()
          const sparkData = ind.history.map((v, i) => ({
            v,
            i,
            ts: nowMs - (ind.history.length - 1 - i) * 24 * 60 * 60 * 1000,
          }))
          const isPositiveChange = displayChange >= 0
          const ChangeIcon = displayChange === 0 ? Minus : isPositiveChange ? TrendingUp : TrendingDown

          return (
            <div
              key={ind.name}
              className={`rounded-xl border ${styles.border} bg-slate-800 p-4 space-y-3`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-medium mb-0.5">{ind.name}</div>
                  <div className="text-2xl font-bold text-white flex items-center gap-2">
                    {displayValue.toLocaleString('fr-FR')}
                    <span className="text-sm font-normal text-slate-400">{ind.unit}</span>
                    {liveData && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" title="Temps réel" />}
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full mt-1 ${styles.dot}`} />
              </div>

              <div className="flex items-center gap-2">
                <ChangeIcon
                  size={13}
                  className={isPositiveChange ? 'text-green-400' : 'text-red-400'}
                />
                <span
                  className={`text-xs font-medium ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}
                >
                  {isPositiveChange ? '+' : ''}{displayChange.toFixed(2)} {liveData ? '%' : ind.unit}
                </span>
                <span className="text-xs text-slate-500">vs veille</span>
              </div>

              {/* Sparkline */}
              <ResponsiveContainer width="100%" height={40}>
                <LineChart data={sparkData}>
                  <XAxis dataKey="ts" type="number" scale="time" domain={['dataMin', 'dataMax']} hide />
                  <YAxis domain={['dataMin', 'dataMax']} hide />
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={ind.status === 'good' ? '#22c55e' : ind.status === 'bad' ? '#f87171' : '#6366f1'}
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Tooltip
                    contentStyle={{ background: 'var(--tooltip-bg)', border: 'none', borderRadius: '6px', fontSize: '11px', padding: '4px 8px', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }}
                    labelFormatter={(v: number) => new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    formatter={(v: number) => [`${v} ${ind.unit}`, ind.name]}
                  />
                </LineChart>
              </ResponsiveContainer>

              <p className="text-xs text-slate-500 leading-relaxed">{ind.description}</p>
            </div>
          )
        })}
      </div>

      {/* Summary banner */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        <h3 className="text-base font-semibold text-white mb-3">Synthèse Macro</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-white">Emploi robuste</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Chômage US à 3.7%, proche du plein emploi. Soutien à la consommation.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-white">Inflation en baisse mais persistante</div>
              <div className="text-xs text-slate-400 mt-0.5">
                CPI à 3.2%, en déclin mais au-dessus de l'objectif 2% de la Fed.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-white">Volatilité modérée</div>
              <div className="text-xs text-slate-400 mt-0.5">
                VIX à 18.5, signalant une anxiété de marché contenue. Zone neutre.
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* JoseIndex2000 */}
      <JoseIndexSection />

      <Sources sources={[
        { label: 'VIX — CBOE', url: 'https://www.cboe.com/tradable_products/vix/' },
        { label: 'S&P 500 P/E — Multpl', url: 'https://www.multpl.com/s-p-500-pe-ratio' },
        { label: 'US 10Y Treasury — FRED', url: 'https://fred.stlouisfed.org/series/DGS10' },
        { label: 'OAT France — Banque de France', url: 'https://www.banque-france.fr/statistiques/taux-et-cours/taux-interet-direct' },
        { label: 'Prix de l\'or — World Gold Council', url: 'https://www.gold.org/goldhub/data/gold-prices' },
        { label: 'Inflation US — BLS', url: 'https://www.bls.gov/cpi/' },
      ]} />
    </div>
  )
}

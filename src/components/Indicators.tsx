import { marketIndicators } from '../data/indicators'
import { LineChart, Line, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react'
import { useLiveQuotes } from '../hooks/useLiveQuotes'
import { INDICATOR_TICKERS } from '../services/marketData'
import Sources from './Sources'

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
          <p className="text-slate-400 text-sm mt-1">Suivi des indicateurs macroéconomiques clés</p>
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
          const sparkData = ind.history.map((v, i) => ({ v, i }))
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
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={ind.status === 'good' ? '#22c55e' : ind.status === 'bad' ? '#f87171' : '#6366f1'}
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '6px', fontSize: '11px', padding: '4px 8px', color: '#e2e8f0' }} itemStyle={{ color: '#e2e8f0' }}
                    labelFormatter={() => ''}
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

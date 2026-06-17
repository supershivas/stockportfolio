import { marketIndicators } from '../data/indicators'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const STATUS_STYLES = {
  good: { border: 'border-green-500/30', dot: 'bg-green-400' },
  neutral: { border: 'border-slate-600', dot: 'bg-yellow-400' },
  bad: { border: 'border-red-500/30', dot: 'bg-red-400' },
}

export default function Indicators() {
  const now = new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Indicateurs de Marché</h1>
          <p className="text-slate-400 text-sm mt-1">Suivi des indicateurs macroéconomiques clés</p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
          Dernière mise à jour : <span className="text-slate-400">{now}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {marketIndicators.map((ind) => {
          const styles = STATUS_STYLES[ind.status]
          const sparkData = ind.history.map((v, i) => ({ v, i }))
          const isPositiveChange = ind.change >= 0
          const ChangeIcon = ind.change === 0 ? Minus : isPositiveChange ? TrendingUp : TrendingDown

          return (
            <div
              key={ind.name}
              className={`rounded-xl border ${styles.border} bg-slate-800 p-4 space-y-3`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-medium mb-0.5">{ind.name}</div>
                  <div className="text-2xl font-bold text-white">
                    {ind.value.toLocaleString('fr-FR')}
                    <span className="text-sm font-normal text-slate-400 ml-1">{ind.unit}</span>
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
                  {isPositiveChange ? '+' : ''}{ind.change} {ind.unit}
                </span>
                <span className="text-xs text-slate-500">vs veille</span>
              </div>

              {/* Sparkline */}
              <ResponsiveContainer width="100%" height={40}>
                <LineChart data={sparkData}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={ind.status === 'good' ? '#22c55e' : ind.status === 'bad' ? '#f87171' : '#6366f1'}
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '6px', fontSize: '11px', padding: '4px 8px' }}
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
    </div>
  )
}

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Info, TrendingUp } from 'lucide-react'
import { JOSE_COMPONENTS, JOSE_SCORE, JOSE_HISTORY_2Y, JOSE_HISTORY_1Y, JOSE_HISTORY_30D, getJoseStatus } from '../data/joseIndex'

type JoseTimeframe = '30d' | '1y' | '2y'

export default function JosePublic() {
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
  const stepMs: Record<JoseTimeframe, number> = {
    '30d': 24 * 60 * 60 * 1000,
    '1y': 30 * 24 * 60 * 60 * 1000,
    '2y': 7 * 24 * 60 * 60 * 1000,
  }
  const nowTs = Date.now()
  const step = stepMs[timeframe]
  const chartData = history.map((v, i) => ({ i, v, ts: nowTs - (history.length - 1 - i) * step }))
  const prev = history[history.length - 2] ?? JOSE_SCORE
  const delta = JOSE_SCORE - prev

  const angle = -90 + (JOSE_SCORE / 100) * 180
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const gx = 60 + 48 * Math.cos(toRad(angle))
  const gy = 60 + 48 * Math.sin(toRad(angle))

  return (
    <div className="min-h-screen" style={{ background: 'var(--content-bg)', color: 'var(--text-primary)' }}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <TrendingUp size={15} color="#fff" />
            </div>
            <span className="font-bold text-base font-title" style={{ color: 'var(--text-primary)' }}>PortfolioAI</span>
          </div>
          <a
            href="/"
            className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}
          >
            Ouvrir l'app →
          </a>
        </div>

        {/* Main card */}
        <div className="rounded-xl border p-5 space-y-5" style={{ background: 'var(--card-bg)', borderColor: status.color + '44' }}>
          {/* Title + timeframe */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>JoseIndex2000</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: status.bg, color: status.color }}>
                  {status.label}
                </span>
              </div>
              <p className="text-xs max-w-xl" style={{ color: 'var(--text-muted)' }}>
                {status.description} · Indice composite pondéré de 8 indicateurs macroéconomiques.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {(['30d', '1y', '2y'] as JoseTimeframe[]).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className="text-xs px-2.5 py-1 rounded-md border transition-colors"
                  style={{
                    background: timeframe === tf ? 'var(--accent)' : 'transparent',
                    borderColor: timeframe === tf ? 'var(--accent)' : 'var(--card-border)',
                    color: timeframe === tf ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {labelMap[tf]}
                </button>
              ))}
            </div>
          </div>

          {/* Gauge + chart */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center">
              <svg viewBox="0 0 120 70" className="w-36">
                <path d="M12,60 A48,48 0 0,1 108,60" fill="none" stroke="var(--card-border)" strokeWidth="8" strokeLinecap="round"/>
                <path
                  d={`M12,60 A48,48 0 ${angle > 0 ? 1 : 0},1 ${gx.toFixed(1)},${gy.toFixed(1)}`}
                  fill="none"
                  stroke={status.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <circle cx={gx.toFixed(1)} cy={gy.toFixed(1)} r="5" fill={status.color} />
                <text x="10" y="68" fontSize="7" fill="var(--text-muted)">0</text>
                <text x="56" y="16" fontSize="7" fill="var(--text-muted)" textAnchor="middle">50</text>
                <text x="104" y="68" fontSize="7" fill="var(--text-muted)" textAnchor="end">100</text>
              </svg>
              <div className="text-4xl font-bold mt-1" style={{ color: status.color }}>{JOSE_SCORE}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Score / 100</div>
              <div className={`text-xs mt-1 font-medium ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)} vs période préc.
              </div>
            </div>

            <div className="sm:col-span-2">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Historique — {labelMap[timeframe]}</div>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="joseGradPub" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={status.color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={status.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <YAxis domain={[30, 80]} hide />
                  <XAxis dataKey="ts" type="number" scale="time" domain={['dataMin', 'dataMax']} hide />
                  <Tooltip
                    contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '6px', fontSize: '11px', padding: '4px 8px', color: 'var(--text-primary)' }}
                    labelFormatter={(v: number) => new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    formatter={(v: number) => [`${v}`, 'JoseIndex2000']}
                  />
                  <Area type="monotone" dataKey="v" stroke={status.color} strokeWidth={2} fill="url(#joseGradPub)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
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
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{z.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Component toggle */}
          <button
            onClick={() => setShowDetails(v => !v)}
            className="flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <Info size={12} />
            {showDetails ? 'Masquer' : 'Voir'} les {JOSE_COMPONENTS.length} composantes
          </button>

          {showDetails && (
            <div className="space-y-2">
              {JOSE_COMPONENTS.map(c => {
                const bar = Math.round(c.normalizedScore)
                const t7 = c.trend7d > 0 ? 'text-green-400' : c.trend7d < 0 ? 'text-red-400' : ''
                const t3 = c.trend3m > 0 ? 'text-green-400' : c.trend3m < 0 ? 'text-red-400' : ''
                const t1 = c.trend1y > 0 ? 'text-green-400' : c.trend1y < 0 ? 'text-red-400' : ''
                const scoreColor = bar >= 65 ? '#4ade80' : bar >= 50 ? '#facc15' : bar >= 35 ? '#fb923c' : '#f87171'
                return (
                  <div key={c.name} className="rounded-lg px-4 py-3 grid grid-cols-12 gap-2 items-center" style={{ background: 'var(--card-bg-2)' }}>
                    <div className="col-span-12 sm:col-span-4">
                      <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{c.name}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.interpretation}</div>
                    </div>
                    <div className="col-span-4 sm:col-span-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-mono">{c.value} {c.unit}</span>
                    </div>
                    <div className="col-span-8 sm:col-span-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
                        <div className="h-full rounded-full" style={{ width: `${bar}%`, background: scoreColor }} />
                      </div>
                      <span className="text-[10px] font-semibold w-6 text-right" style={{ color: scoreColor }}>{bar}</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>({c.weight}%)</span>
                    </div>
                    <div className="col-span-12 sm:col-span-3 flex gap-3 text-[10px]">
                      <span className={t7}>7j: {c.trend7d > 0 ? '+' : ''}{c.trend7d}%</span>
                      <span className={t3}>3m: {c.trend3m > 0 ? '+' : ''}{c.trend3m}%</span>
                      <span className={t1}>1a: {c.trend1y > 0 ? '+' : ''}{c.trend1y}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
          JoseIndex2000 · données indicatives · PortfolioAI
        </p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Info } from 'lucide-react'
import {
  JEROME_ULTRA_COMPONENTS, JEROME_ULTRA_SCORE, getJeromeUltraRecommendation,
  CURRENT_MACRO_REGIME, JEROME_ULTRA_HISTORY_30D, JEROME_ULTRA_HISTORY_1Y, JEROME_ULTRA_HISTORY_2Y,
} from '../data/jeromeIndexUltra'

type Tf = '30d' | '1y' | '2y'

const REGIMES = [
  { id: 'goldilocks',  label: 'Goldilocks',  color: '#4ade80', icon: '🌤', desc: 'Croissance + inflation basse' },
  { id: 'reflation',   label: 'Reflation',   color: '#fb923c', icon: '🔥', desc: 'Croissance + inflation haute' },
  { id: 'stagflation', label: 'Stagflation', color: '#f87171', icon: '😵', desc: 'Stagnation + inflation' },
  { id: 'deflation',   label: 'Déflation',   color: '#818cf8', icon: '❄️', desc: 'Contraction + inflation basse' },
]

export default function JeromeUltraSection() {
  const [tf, setTf] = useState<Tf>('1y')
  const [showDetails, setShowDetails] = useState(false)
  const rec = getJeromeUltraRecommendation(JEROME_ULTRA_SCORE)

  const histMap = { '30d': JEROME_ULTRA_HISTORY_30D, '1y': JEROME_ULTRA_HISTORY_1Y, '2y': JEROME_ULTRA_HISTORY_2Y }
  const labelMap = { '30d': '30 jours', '1y': '12 mois', '2y': '2 ans' }
  const stepMs = { '30d': 86400000, '1y': 30 * 86400000, '2y': 7 * 86400000 }
  const history = histMap[tf]
  const nowTs = Date.now()
  const step = stepMs[tf]
  const chartData = history.map((v, i) => ({ v, ts: nowTs - (history.length - 1 - i) * step }))
  const prev = history[history.length - 2] ?? JEROME_ULTRA_SCORE
  const delta = JEROME_ULTRA_SCORE - prev

  // Score color
  const scoreColor = JEROME_ULTRA_SCORE > 65 ? '#4ade80' : JEROME_ULTRA_SCORE >= 45 ? '#facc15' : '#818cf8'
  const gradId = 'jUltraGrad'

  // Allocation bar
  const { stocks, bonds, cash } = rec.allocation

  return (
    <div className="rounded-xl border p-5 space-y-5" style={{ background: 'var(--card-bg)', borderColor: scoreColor + '44' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>JérômeIndex Ultra</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: scoreColor + '22', color: scoreColor }}>{rec.label}</span>
          </div>
          <p className="text-xs max-w-xl" style={{ color: 'var(--text-muted)' }}>{rec.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(['30d', '1y', '2y'] as Tf[]).map(t => (
            <button key={t} onClick={() => setTf(t)}
              className="text-xs px-2.5 py-1 rounded-md border transition-colors"
              style={{ background: tf === t ? 'var(--accent)' : 'transparent', borderColor: tf === t ? 'var(--accent)' : 'var(--card-border)', color: tf === t ? '#fff' : 'var(--text-muted)' }}>
              {labelMap[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Score + chart */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Score + allocation */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="text-5xl font-bold" style={{ color: scoreColor }}>{JEROME_ULTRA_SCORE}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Score / 100</div>
          <div className={`text-xs font-medium ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)} vs période préc.
          </div>
          {/* Allocation bar */}
          <div className="w-full space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Allocation suggérée</div>
            <div className="flex rounded-full overflow-hidden h-3 w-full">
              <div style={{ width: `${stocks}%`, background: '#4ade80' }} title={`Actions ${stocks}%`} />
              <div style={{ width: `${bonds}%`, background: '#818cf8' }} title={`Obligations ${bonds}%`} />
              <div style={{ width: `${cash}%`, background: '#94a3b8' }} title={`Cash ${cash}%`} />
            </div>
            <div className="flex gap-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              <span><span style={{ color: '#4ade80' }}>●</span> Actions {stocks}%</span>
              <span><span style={{ color: '#818cf8' }}>●</span> Oblig. {bonds}%</span>
              <span><span style={{ color: '#94a3b8' }}>●</span> Cash {cash}%</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="sm:col-span-2">
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Historique — {labelMap[tf]}</div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={scoreColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={scoreColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="ts" type="number" scale="time" domain={['dataMin', 'dataMax']} hide />
              <YAxis domain={[30, 70]} hide />
              <Tooltip
                contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-primary)' }}
                labelFormatter={(v: number) => new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                formatter={(v: number) => [`${v}`, 'JérômeIndex Ultra']}
              />
              <Area type="monotone" dataKey="v" stroke={scoreColor} strokeWidth={2} fill={`url(#${gradId})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          {/* Zone legend */}
          <div className="flex flex-wrap gap-3 mt-2">
            {[
              { label: 'Surpondérer Oblig. <45', color: '#818cf8' },
              { label: 'Neutre 45-65', color: '#facc15' },
              { label: 'Surpondérer Actions >65', color: '#4ade80' },
            ].map(z => (
              <div key={z.label} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: z.color }} />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{z.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Macro Regime */}
      <div className="rounded-lg p-4 space-y-3" style={{ background: 'var(--card-bg-2)', border: '1px solid var(--card-border)' }}>
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Régime Macro Actuel</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {REGIMES.map(r => {
            const active = CURRENT_MACRO_REGIME.regime === r.id
            return (
              <div key={r.id} className="rounded-lg px-3 py-2.5 text-center transition-opacity"
                style={{ background: active ? r.color + '22' : 'transparent', border: `1px solid ${active ? r.color : 'var(--card-border)'}`, opacity: active ? 1 : 0.45 }}>
                <div className="text-lg mb-0.5">{r.icon}</div>
                <div className="text-xs font-semibold" style={{ color: active ? r.color : 'var(--text-muted)' }}>{r.label}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.desc}</div>
              </div>
            )
          })}
        </div>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-semibold" style={{ color: '#fb923c' }}>Stratégie :</span> {CURRENT_MACRO_REGIME.recommended}
        </div>
      </div>

      {/* Components toggle */}
      <button onClick={() => setShowDetails(v => !v)} className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: 'var(--text-muted)' }}>
        <Info size={12} />
        {showDetails ? 'Masquer' : 'Voir'} les {JEROME_ULTRA_COMPONENTS.length} composantes
      </button>

      {showDetails && (
        <div className="space-y-2">
          {JEROME_ULTRA_COMPONENTS.map(c => {
            const bar = Math.round(c.normalizedScore)
            const sc = bar >= 65 ? '#4ade80' : bar >= 45 ? '#facc15' : '#818cf8'
            const t7 = c.trend7d > 0 ? 'text-green-400' : c.trend7d < 0 ? 'text-red-400' : ''
            const t3 = c.trend3m > 0 ? 'text-green-400' : c.trend3m < 0 ? 'text-red-400' : ''
            const t1 = c.trend1y > 0 ? 'text-green-400' : c.trend1y < 0 ? 'text-red-400' : ''
            return (
              <div key={c.name} className="rounded-lg px-4 py-3 grid grid-cols-12 gap-2 items-center" style={{ background: 'var(--card-bg-2)' }}>
                <div className="col-span-12 sm:col-span-4">
                  <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{c.name}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.interpretation}</div>
                </div>
                <div className="col-span-4 sm:col-span-2 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{c.value} {c.unit}</div>
                <div className="col-span-8 sm:col-span-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
                    <div className="h-full rounded-full" style={{ width: `${bar}%`, background: sc }} />
                  </div>
                  <span className="text-[10px] font-semibold w-6 text-right" style={{ color: sc }}>{bar}</span>
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
  )
}

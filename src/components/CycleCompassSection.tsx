import { useState } from 'react'
import {
  CYCLE_PHASES, CURRENT_PHASE_ID, CYCLE_CONFIDENCE, CYCLE_TRANSITION,
  CYCLE_LEADING_INDICATORS, CYCLE_HISTORY_24M,
} from '../data/cycleCompass'

export default function CycleCompassSection() {
  const [showIndicators, setShowIndicators] = useState(false)
  const currentPhase = CYCLE_PHASES.find(p => p.id === CURRENT_PHASE_ID)!

  // Clock SVG: 200x200 center at 100,100 radius 80
  const cx = 100, cy = 100, r = 80

  return (
    <div className="rounded-xl border p-5 space-y-5" style={{ background: 'var(--card-bg)', borderColor: currentPhase.color + '44' }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>CycleCompass</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: currentPhase.color + '22', color: currentPhase.color }}>
              {currentPhase.labelFr}
            </span>
          </div>
          <p className="text-xs max-w-xl" style={{ color: 'var(--text-muted)' }}>
            Horloge du cycle économique — position actuelle et stratégie d'allocation par phase.
          </p>
        </div>
        <div className="text-xs px-2.5 py-1 rounded-md shrink-0" style={{ background: 'var(--card-bg-2)', color: 'var(--text-muted)' }}>
          Confiance {CYCLE_CONFIDENCE}%
        </div>
      </div>

      {/* Clock + Phase detail */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Clock SVG */}
        <div className="flex flex-col items-center gap-3">
          <svg viewBox="0 0 200 200" className="w-52 h-52">
            {/* Background arcs per phase */}
            {CYCLE_PHASES.map(phase => {
              const startAngle = (phase.angle - 90) * (Math.PI / 180)
              const endAngle = (phase.angle - 90 + 90) * (Math.PI / 180)
              const x1 = cx + r * Math.cos(startAngle)
              const y1 = cy + r * Math.sin(startAngle)
              const x2 = cx + r * Math.cos(endAngle)
              const y2 = cy + r * Math.sin(endAngle)
              const active = phase.id === CURRENT_PHASE_ID
              return (
                <path
                  key={phase.id}
                  d={`M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`}
                  fill={phase.color}
                  opacity={active ? 0.25 : 0.07}
                  stroke={phase.color}
                  strokeWidth={active ? 1.5 : 0.5}
                  strokeOpacity={active ? 0.6 : 0.2}
                />
              )
            })}
            {/* Outer circle */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--card-border)" strokeWidth="1" />
            {/* Phase labels */}
            {CYCLE_PHASES.map(phase => {
              const midAngle = (phase.angle - 90 + 45) * (Math.PI / 180)
              const labelR = r * 0.68
              const lx = cx + labelR * Math.cos(midAngle)
              const ly = cy + labelR * Math.sin(midAngle)
              const active = phase.id === CURRENT_PHASE_ID
              return (
                <text
                  key={phase.id}
                  x={lx.toFixed(1)}
                  y={ly.toFixed(1)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={active ? 8 : 7}
                  fontWeight={active ? 'bold' : 'normal'}
                  fill={phase.color}
                  opacity={active ? 1 : 0.5}
                >
                  {phase.label}
                </text>
              )
            })}
            {/* Clock hands — pointing to current phase midpoint */}
            {(() => {
              const handAngle = (currentPhase.angle - 90 + 45) * (Math.PI / 180)
              const hx = cx + (r * 0.55) * Math.cos(handAngle)
              const hy = cy + (r * 0.55) * Math.sin(handAngle)
              return (
                <>
                  <line x1={cx} y1={cy} x2={hx.toFixed(1)} y2={hy.toFixed(1)} stroke={currentPhase.color} strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx={cx} cy={cy} r="4" fill={currentPhase.color} />
                </>
              )
            })()}
            {/* Clock positions */}
            {['12h', '3h', '6h', '9h'].map((pos, i) => {
              const a = (i * 90 - 90) * (Math.PI / 180)
              const px = cx + (r + 8) * Math.cos(a)
              const py = cy + (r + 8) * Math.sin(a)
              return (
                <text key={pos} x={px.toFixed(1)} y={py.toFixed(1)} textAnchor="middle" dominantBaseline="middle" fontSize="6" fill="var(--text-muted)" opacity="0.5">
                  {pos}
                </text>
              )
            })}
          </svg>
          <div className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>{CYCLE_TRANSITION}</div>
        </div>

        {/* Current phase detail */}
        <div className="space-y-3">
          <div className="rounded-lg p-4 space-y-2.5" style={{ background: 'var(--card-bg-2)', border: `1px solid ${currentPhase.color}44` }}>
            <div className="text-sm font-semibold" style={{ color: currentPhase.color }}>{currentPhase.label} · {currentPhase.clockPosition}</div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{currentPhase.description}</p>
            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Durée typique : {currentPhase.typicalDuration}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg p-3 space-y-1.5" style={{ background: 'var(--card-bg-2)' }}>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-green-400">Favoriser</div>
              {currentPhase.bestAssets.map(a => (
                <div key={a} className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>· {a}</div>
              ))}
            </div>
            <div className="rounded-lg p-3 space-y-1.5" style={{ background: 'var(--card-bg-2)' }}>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Éviter</div>
              {currentPhase.avoidAssets.map(a => (
                <div key={a} className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>· {a}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 24-month history */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Historique 24 mois</div>
        <div className="flex flex-wrap gap-1">
          {CYCLE_HISTORY_24M.map(entry => {
            const ph = CYCLE_PHASES.find(p => p.id === entry.phase)!
            return (
              <div key={entry.month} title={`${entry.month} — ${ph.label}`}
                className="rounded px-1.5 py-0.5 text-[9px] font-medium"
                style={{ background: ph.color + '22', color: ph.color, border: `1px solid ${ph.color}44` }}>
                {entry.month.slice(2)}
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-1">
          {CYCLE_PHASES.map(p => (
            <div key={p.id} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leading indicators toggle */}
      <button onClick={() => setShowIndicators(v => !v)} className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: 'var(--text-muted)' }}>
        <span style={{ fontSize: 12 }}>ℹ</span>
        {showIndicators ? 'Masquer' : 'Voir'} les {CYCLE_LEADING_INDICATORS.length} indicateurs avancés
      </button>

      {showIndicators && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CYCLE_LEADING_INDICATORS.map(ind => {
            const sc = ind.signal === 'positive' ? '#4ade80' : ind.signal === 'negative' ? '#f87171' : '#facc15'
            return (
              <div key={ind.name} className="rounded-lg px-4 py-3 flex items-start gap-3" style={{ background: 'var(--card-bg-2)' }}>
                <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: sc }} />
                <div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{ind.name} <span className="font-mono font-normal" style={{ color: sc }}>{ind.value}</span></div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{ind.description}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { usePortfolioStore } from '../store/portfolioStore'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'

const SCENARIOS = [
  { key: 'conservative', label: 'Conservateur', rate: 0.04, color: '#3b82f6' },
  { key: 'moderate', label: 'Modéré', rate: 0.07, color: '#6366f1' },
  { key: 'optimistic', label: 'Optimiste', rate: 0.10, color: '#22c55e' },
]

type ScenarioKey = 'conservative' | 'moderate' | 'optimistic'

export default function Projections() {
  const positions = usePortfolioStore((s) => s.positions)
  const portfolioTotal = positions.reduce((s, p) => s + p.quantity * p.currentPrice, 0)

  const [startValue, setStartValue] = useState(Math.round(portfolioTotal))
  const [monthly, setMonthly] = useState(500)
  const [years, setYears] = useState(20)
  const [inflation, setInflation] = useState(false)
  const [scenarios, setScenarios] = useState<Record<ScenarioKey, boolean>>({ conservative: true, moderate: true, optimistic: true })

  const INFLATION_RATE = 0.025

  const buildData = () => {
    const data: Record<string, number | string>[] = []
    for (let y = 0; y <= years; y++) {
      const point: Record<string, number | string> = { year: `An ${y}` }
      SCENARIOS.forEach(({ key, rate }) => {
        if (!scenarios[key as ScenarioKey]) return
        const effectiveRate = inflation ? rate - INFLATION_RATE : rate
        let value = startValue
        for (let m = 0; m < y * 12; m++) {
          value = value * (1 + effectiveRate / 12) + monthly
        }
        point[key] = Math.round(value)
      })
      data.push(point)
    }
    return data
  }

  const data = buildData()
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
  const milestones = [5, 10, 20, 30].filter((m) => m <= years)

  const finalValues = SCENARIOS.map(({ key, label, rate, color }) => {
    const effectiveRate = inflation ? rate - INFLATION_RATE : rate
    let value = startValue
    for (let m = 0; m < years * 12; m++) {
      value = value * (1 + effectiveRate / 12) + monthly
    }
    return { key, label, rate, color, final: Math.round(value) }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Projections</h1>
        <p className="text-slate-400 text-sm mt-1">Simulez la croissance de votre portefeuille</p>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        <h2 className="text-base font-semibold text-white mb-4">Paramètres de simulation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Valeur initiale</label>
            <input
              type="number"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white"
              value={startValue}
              onChange={(e) => setStartValue(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Apport mensuel (€)</label>
            <input
              type="number"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white"
              value={monthly}
              onChange={(e) => setMonthly(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-2">
              Horizon: <span className="text-white font-medium">{years} ans</span>
            </label>
            <input
              type="range"
              min={1}
              max={30}
              value={years}
              onChange={(e) => setYears(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>1 an</span>
              <span>30 ans</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-3">Options</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="inflation"
                checked={inflation}
                onChange={(e) => setInflation(e.target.checked)}
                className="accent-indigo-500"
              />
              <label htmlFor="inflation" className="text-sm text-slate-300 cursor-pointer">
                Ajuster pour l'inflation (2.5%)
              </label>
            </div>
          </div>
        </div>

        {/* Scenario toggles */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-700">
          {SCENARIOS.map(({ key, label, rate, color }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={scenarios[key as ScenarioKey]}
                onChange={(e) =>
                  setScenarios((s) => ({ ...s, [key]: e.target.checked }))
                }
                className="accent-indigo-500"
              />
              <span className="text-sm" style={{ color }}>
                {label} ({(rate * 100).toFixed(0)}%/an)
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        <h2 className="text-base font-semibold text-white mb-4">Évolution projetée</h2>
        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              {SCENARIOS.map(({ key, color }) => (
                <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="year"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              interval={Math.floor(years / 5)}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k€`}
            />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px' }}
              formatter={(v: number, name: string) => {
                const s = SCENARIOS.find((sc) => sc.key === name)
                return [fmt(v), s?.label || name]
              }}
            />
            <Legend formatter={(val: string) => {
              const s = SCENARIOS.find((sc) => sc.key === val)
              return <span className="text-slate-300 text-xs">{s?.label || val}</span>
            }} />
            {milestones.map((m) => (
              <ReferenceLine
                key={m}
                x={`An ${m}`}
                stroke="#475569"
                strokeDasharray="4 4"
                label={{ value: `${m}a`, position: 'top', fill: '#64748b', fontSize: 10 }}
              />
            ))}
            {SCENARIOS.map(({ key, color }) =>
              scenarios[key as ScenarioKey] ? (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#grad-${key})`}
                />
              ) : null
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {finalValues.map(({ label, color, final, rate }) => (
          <div key={label} className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-slate-300 font-medium">{label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{fmt(final)}</div>
            <div className="text-slate-400 text-xs mt-1">
              Rendement annuel: <span className="text-slate-200">{(rate * 100).toFixed(0)}%</span>
              {inflation && <span className="text-slate-500"> (corrigé inflation)</span>}
            </div>
            <div className="text-slate-400 text-xs mt-0.5">
              Dans {years} an{years > 1 ? 's' : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

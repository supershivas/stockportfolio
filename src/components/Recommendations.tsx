import { useState } from 'react'
import { recommendations } from '../data/recommendations'
import Sources from './Sources'
import { InvestmentHouse } from '../types'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'

const ALLOC_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#3b82f6']
const RISK_COLORS: Record<string, string> = {
  Faible: 'text-green-400 bg-green-400/10',
  Modéré: 'text-yellow-400 bg-yellow-400/10',
  Élevé: 'text-red-400 bg-red-400/10',
}

export default function Recommendations() {
  const [selected, setSelected] = useState<InvestmentHouse>('Vanguard')
  const rec = recommendations.find((r) => r.house === selected)!

  const allocData = [
    { name: 'Actions', value: rec.allocation.equities },
    { name: 'Obligations', value: rec.allocation.bonds },
    { name: 'Alternatifs', value: rec.allocation.alternatives },
    { name: 'Cash', value: rec.allocation.cash },
  ]

  const comparisonData = recommendations.map((r) => ({
    house: r.house.split(' ')[0],
    Actions: r.allocation.equities,
    Obligations: r.allocation.bonds,
    Alternatifs: r.allocation.alternatives,
    Cash: r.allocation.cash,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Recommandations</h1>
        <p className="text-slate-400 text-sm mt-1">Perspectives mi-2026 de Vanguard, BlackRock, Fidelity, JPMorgan, Goldman Sachs et Morgan Stanley. Comparez leurs allocations et convictions pour calibrer votre portefeuille.</p>
      </div>

      {/* House selector */}
      <div className="flex flex-wrap gap-2">
        {recommendations.map((r) => (
          <button
            key={r.house}
            onClick={() => setSelected(r.house)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selected === r.house
                ? 'bg-accent text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500'
            }`}
          >
            {r.house}
          </button>
        ))}
      </div>

      {/* Macro outlook */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
            <span className="text-accent/80 font-bold text-sm">{rec.house.slice(0, 2)}</span>
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-semibold text-white">{rec.house} — Perspectives Mi-2026</h2>
              <span className="text-xs bg-accent/15 text-accent/80 border border-accent/30 px-2 py-0.5 rounded">Juin 2026</span>
            </div>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">{rec.outlook}</p>
          </div>
        </div>
      </div>

      {/* Allocation + funds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <h3 className="text-base font-semibold text-white mb-4">Allocation Recommandée</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={allocData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {allocData.map((_, i) => (
                  <Cell key={i} fill={ALLOC_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'var(--tooltip-bg)', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v: number) => [`${v}%`, '']}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(val) => <span className="text-slate-300 text-xs">{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Over/underweights */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <h3 className="text-base font-semibold text-white mb-4">Convictions</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-green-400" />
                <span className="text-sm font-medium text-green-400">Surpondérations</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {rec.overweights.map((ow) => (
                  <span key={ow} className="px-3 py-1 rounded-full text-xs bg-green-400/10 text-green-400 border border-green-400/20">
                    {ow}
                  </span>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={16} className="text-red-400" />
                <span className="text-sm font-medium text-red-400">Sous-pondérations</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {rec.underweights.map((uw) => (
                  <span key={uw} className="px-3 py-1 rounded-full text-xs bg-red-400/10 text-red-400 border border-red-400/20">
                    {uw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top funds table */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700">
          <h3 className="text-base font-semibold text-white">Fonds & ETF Recommandés</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Ticker', 'Nom', 'Catégorie', 'Rend. attendu', 'Risque'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rec.topFunds.map((f) => (
                <tr key={f.ticker} className="border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-mono font-bold text-accent/80">{f.ticker}</td>
                  <td className="px-4 py-3 text-white">{f.name}</td>
                  <td className="px-4 py-3 text-slate-300">{f.category}</td>
                  <td className="px-4 py-3">
                    <span className="text-green-400 font-medium">{f.expectedReturn}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RISK_COLORS[f.risk]}`}>
                      {f.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison chart */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        <h3 className="text-base font-semibold text-white mb-4">Comparaison des Allocations</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="house" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip
              contentStyle={{ background: 'var(--tooltip-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', fontSize: '12px' }}
              formatter={(v: number) => [`${v}%`, '']}
            />
            <Legend formatter={(val: string) => <span className="text-slate-300 text-xs">{val}</span>} />
            {['Actions', 'Obligations', 'Alternatifs', 'Cash'].map((key, i) => (
              <Bar key={key} dataKey={key} stackId="a" fill={ALLOC_COLORS[i]} radius={i === 3 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Sources sources={[
        { label: 'Vanguard Investment Commentary', url: 'https://investor.vanguard.com/investor-resources-education/article/investment-commentary' },
        { label: 'BlackRock Investment Institute', url: 'https://www.blackrock.com/corporate/insights/blackrock-investment-institute' },
        { label: 'Fidelity Market Outlook', url: 'https://www.fidelity.com/learning-center/trading-investing/markets-sectors/market-outlook' },
        { label: 'JPMorgan Market Insights', url: 'https://am.jpmorgan.com/us/en/asset-management/adv/insights/market-insights/' },
        { label: 'Goldman Sachs Research', url: 'https://www.goldmansachs.com/intelligence/pages/gs-research.html' },
        { label: 'Morgan Stanley Outlook', url: 'https://www.morganstanley.com/ideas/investment-outlook' },
      ]} />
    </div>
  )
}

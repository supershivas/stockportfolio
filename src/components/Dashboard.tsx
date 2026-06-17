import { usePortfolioStore } from '../store/portfolioStore'
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react'
import {
  LineChart, Line, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const INDEX_DATA = [
  {
    name: 'S&P 500', value: 4783.45, change: 1.23,
    spark: [4600, 4650, 4620, 4700, 4720, 4680, 4750, 4783],
  },
  {
    name: 'NASDAQ', value: 15011.35, change: 1.87,
    spark: [14500, 14600, 14550, 14700, 14800, 14750, 14900, 15011],
  },
  {
    name: 'CAC 40', value: 7568.20, change: -0.34,
    spark: [7600, 7580, 7560, 7520, 7500, 7540, 7570, 7568],
  },
  {
    name: 'MSCI World', value: 3182.60, change: 0.92,
    spark: [3100, 3120, 3110, 3140, 3150, 3160, 3170, 3182],
  },
]

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6']

export default function Dashboard() {
  const positions = usePortfolioStore((s) => s.positions)

  const totalValue = positions.reduce((sum, p) => sum + p.quantity * p.currentPrice, 0)
  const totalCost = positions.reduce((sum, p) => sum + p.quantity * p.purchasePrice, 0)
  const totalPnL = totalValue - totalCost
  const totalReturn = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0

  const dayChange = totalValue * 0.0087

  const sectorMap: Record<string, number> = {}
  positions.forEach((p) => {
    const val = p.quantity * p.currentPrice
    sectorMap[p.sector] = (sectorMap[p.sector] || 0) + val
  })
  const sectorData = Object.entries(sectorMap).map(([name, value]) => ({ name, value }))

  const top5 = [...positions]
    .sort((a, b) => b.quantity * b.currentPrice - a.quantity * a.currentPrice)
    .slice(0, 5)

  const fmt = (n: number, cur = 'USD') =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n)

  const statCards = [
    {
      label: 'Valeur Totale',
      value: fmt(totalValue),
      icon: <DollarSign size={20} className="text-indigo-400" />,
      sub: 'Portfolio complet',
      color: 'text-white',
    },
    {
      label: 'Variation Jour',
      value: `+${fmt(dayChange)}`,
      icon: <TrendingUp size={20} className="text-green-400" />,
      sub: "+0.87% aujourd'hui",
      color: 'text-green-400',
    },
    {
      label: 'P&L Total',
      value: `${totalPnL >= 0 ? '+' : ''}${fmt(totalPnL)}`,
      icon: totalPnL >= 0 ? <TrendingUp size={20} className="text-green-400" /> : <TrendingDown size={20} className="text-red-400" />,
      sub: 'Depuis le début',
      color: totalPnL >= 0 ? 'text-green-400' : 'text-red-400',
    },
    {
      label: 'Rendement',
      value: `${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%`,
      icon: <Percent size={20} className="text-indigo-400" />,
      sub: 'Performance globale',
      color: totalReturn >= 0 ? 'text-green-400' : 'text-red-400',
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
          <div key={c.label} className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-sm">{c.label}</span>
              <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center">
                {c.icon}
              </div>
            </div>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            <div className="text-slate-500 text-xs mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Index cards */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Indices Mondiaux</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {INDEX_DATA.map((idx) => (
            <div key={idx.name} className="rounded-xl border border-slate-700 bg-slate-800 p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-white text-sm">{idx.name}</div>
                  <div className="text-xl font-bold text-white mt-0.5">
                    {idx.value.toLocaleString('fr-FR')}
                  </div>
                </div>
                <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                  idx.change >= 0
                    ? 'text-green-400 bg-green-400/10'
                    : 'text-red-400 bg-red-400/10'
                }`}>
                  {idx.change >= 0 ? '+' : ''}{idx.change}%
                </span>
              </div>
              <ResponsiveContainer width="100%" height={50}>
                <LineChart data={idx.spark.map((v, i) => ({ v, i }))}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={idx.change >= 0 ? '#22c55e' : '#f87171'}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                    labelFormatter={() => ''}
                    formatter={(v: number) => [v.toLocaleString('fr-FR'), idx.name]}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: table + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top holdings */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Top 5 Positions</h2>
          <div className="space-y-2">
            {top5.map((p) => {
              const val = p.quantity * p.currentPrice
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
                    <div className="font-semibold text-white text-sm">
                      {fmt(val, p.currency)}
                    </div>
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
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }}
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
    </div>
  )
}

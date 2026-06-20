import { usePortfolioStore } from '../store/portfolioStore'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { AlertTriangle, Shield, TrendingDown, Activity, RefreshCw } from 'lucide-react'
import { useLiveQuotes } from '../hooks/useLiveQuotes'
import Sources from './Sources'

const CORRELATION_MATRIX = [
  { asset: 'AAPL',  AAPL: 1.00, MSFT: 0.82, NVDA: 0.71, LVMH: 0.35, CW8: 0.78, SP500: 0.65 },
  { asset: 'MSFT',  AAPL: 0.82, MSFT: 1.00, NVDA: 0.68, LVMH: 0.31, CW8: 0.75, SP500: 0.70 },
  { asset: 'NVDA',  AAPL: 0.71, MSFT: 0.68, NVDA: 1.00, LVMH: 0.25, CW8: 0.62, SP500: 0.58 },
  { asset: 'LVMH',  AAPL: 0.35, MSFT: 0.31, NVDA: 0.25, LVMH: 1.00, CW8: 0.48, SP500: 0.42 },
  { asset: 'CW8',   AAPL: 0.78, MSFT: 0.75, NVDA: 0.62, LVMH: 0.48, CW8: 1.00, SP500: 0.92 },
  { asset: 'SP500', AAPL: 0.65, MSFT: 0.70, NVDA: 0.58, LVMH: 0.42, CW8: 0.92, SP500: 1.00 },
]

const CORR_KEYS = ['AAPL', 'MSFT', 'NVDA', 'LVMH', 'CW8', 'SP500']

function corrColor(v: number): string {
  if (v === 1) return 'bg-indigo-600 text-white'
  if (v >= 0.8) return 'bg-red-500/30 text-red-300'
  if (v >= 0.6) return 'bg-orange-500/20 text-orange-300'
  if (v >= 0.4) return 'bg-yellow-500/15 text-yellow-300'
  return 'bg-green-500/15 text-green-300'
}

function buildDrawdown() {
  const data: { month: number; value: number; drawdown: number }[] = []
  let value = 100
  const volatility = 0.015
  let runningMax = 100
  for (let i = 0; i < 120; i++) {
    const trend = 0.006
    const shock = i === 30 ? -0.12 : i === 70 ? -0.08 : 0
    value = value * (1 + trend / 10 + (Math.sin(i * 0.3) * volatility) + shock)
    if (value > runningMax) runningMax = value
    const drawdown = parseFloat(((value / runningMax - 1) * 100).toFixed(2))
    data.push({ month: i, value: parseFloat(value.toFixed(2)), drawdown })
  }
  return data
}

const drawdownData = buildDrawdown()

export default function RiskAnalysis() {
  const positions = usePortfolioStore((s) => s.positions)
  const tickers = positions.map((p) => p.ticker)
  const { quotes: liveQuotes, loading, refresh, lastUpdated } = useLiveQuotes(tickers)

  const totalValue = positions.reduce((s, p) => {
    const live = liveQuotes.get(p.ticker)
    return s + p.quantity * (live ? live.price : p.currentPrice)
  }, 0)
  const totalCost = positions.reduce((s, p) => s + p.quantity * p.purchasePrice, 0)

  const beta = 1.12
  const volatility = 14.8
  const sharpe = 1.34
  const maxDrawdown = Math.min(...drawdownData.map((d) => d.drawdown))

  const riskCards = [
    {
      label: 'Beta du Portefeuille',
      value: beta.toFixed(2),
      sub: 'vs S&P 500',
      icon: <Activity size={20} className="text-indigo-400" />,
      desc: beta > 1.2 ? 'Portefeuille plus volatil que le marché' : 'Corrélation modérée avec le marché',
      color: beta > 1.2 ? 'text-yellow-400' : 'text-white',
    },
    {
      label: 'Volatilité Annualisée',
      value: `${volatility}%`,
      sub: 'Écart-type estimé',
      icon: <TrendingDown size={20} className="text-yellow-400" />,
      desc: volatility < 15 ? 'Volatilité dans la norme pour un portefeuille actions' : 'Volatilité élevée — profil risqué',
      color: volatility < 15 ? 'text-white' : 'text-yellow-400',
    },
    {
      label: 'Ratio de Sharpe',
      value: sharpe.toFixed(2),
      sub: 'Rendement/risque',
      icon: <Shield size={20} className="text-green-400" />,
      desc: sharpe > 1 ? 'Excellent rendement ajusté au risque' : 'Rendement insuffisant pour le risque pris',
      color: sharpe > 1 ? 'text-green-400' : 'text-red-400',
    },
    {
      label: 'Max Drawdown (sim.)',
      value: `${maxDrawdown.toFixed(1)}%`,
      sub: 'Perte max simulée',
      icon: <AlertTriangle size={20} className="text-red-400" />,
      desc: 'Perte maximale depuis un pic dans la simulation',
      color: 'text-red-400',
    },
  ]

  const tips = [
    { status: 'warn', text: 'Concentration technologique élevée (~50% du portefeuille). Envisagez de diversifier vers la santé ou les utilities.' },
    { status: 'good', text: 'Bonne diversification géographique avec LVMH (Europe) et les ETF mondiaux.' },
    { status: 'good', text: "Présence d'ETF (CW8, PE500) qui réduisent le risque idiosyncratique." },
    { status: 'warn', text: "Absence d'obligations ou d'actifs défensifs. Le portefeuille est 100% actions." },
    { status: 'good', text: 'Ratio de Sharpe &gt; 1 indique un excellent rendement ajusté au risque historique.' },
  ]

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analyse de Risque</h1>
          <p className="text-slate-400 text-sm mt-1">Beta, volatilité, Sharpe et drawdown mesurent le risque de votre portefeuille. Un Beta &gt; 1 signifie que vous amplifiez les mouvements du marché. La matrice de corrélation montre si vos titres évoluent ensemble (risque de concentration).</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {lastUpdated ? `Temps réel · ${lastUpdated.toLocaleTimeString('fr-FR', { timeStyle: 'short' })}` : 'Actualiser'}
        </button>
      </div>

      {/* Risk metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {riskCards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400">{c.label}</span>
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                {c.icon}
              </div>
            </div>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            <div className="text-slate-500 text-xs mt-0.5">{c.sub}</div>
            <div className="text-slate-400 text-xs mt-2 leading-relaxed">{c.desc}</div>
          </div>
        ))}
      </div>

      {/* Drawdown chart */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        <h2 className="text-base font-semibold text-white mb-1">Simulation de Drawdown</h2>
        <p className="text-slate-400 text-xs mb-4">Simulation sur 120 mois avec chocs de marché</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={drawdownData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="month"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              tickFormatter={(v: number) => `M${v}`}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px', color: '#e2e8f0' }} itemStyle={{ color: '#e2e8f0' }}
              formatter={(v: number) => [`${v.toFixed(2)}%`, 'Drawdown']}
              labelFormatter={(l: number) => `Mois ${l}`}
            />
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
            <ReferenceLine y={-10} stroke="#f87171" strokeDasharray="3 3" label={{ value: '-10%', fill: '#f87171', fontSize: 10, position: 'right' }} />
            <Line
              type="monotone"
              dataKey="drawdown"
              stroke="#f87171"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Correlation matrix */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        <h2 className="text-base font-semibold text-white mb-1">Matrice de Corrélation</h2>
        <p className="text-slate-400 text-xs mb-4">Corrélations estimées entre les principales positions</p>
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <th className="px-3 py-2 text-slate-400 font-normal text-left w-16"></th>
                {CORR_KEYS.map((k) => (
                  <th key={k} className="px-3 py-2 text-slate-400 font-semibold text-center w-16">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CORRELATION_MATRIX.map((row) => (
                <tr key={row.asset}>
                  <td className="px-3 py-2 text-slate-400 font-semibold">{row.asset}</td>
                  {CORR_KEYS.map((k) => {
                    const v = row[k as keyof typeof row] as number
                    return (
                      <td key={k} className="px-1 py-1 text-center">
                        <div className={`rounded px-2 py-1 font-mono ${corrColor(v)}`}>
                          {v.toFixed(2)}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-700">
          {[
            { color: 'bg-red-500/30', label: 'Très corrélé (>= 0.8)' },
            { color: 'bg-orange-500/20', label: 'Corrélé (0.6–0.8)' },
            { color: 'bg-yellow-500/15', label: 'Faiblement corrélé (0.4–0.6)' },
            { color: 'bg-green-500/15', label: 'Peu corrélé (< 0.4)' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${color}`} />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        <h2 className="text-base font-semibold text-white mb-4">Conseils de Diversification</h2>
        <div className="space-y-3">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${tip.status === 'good' ? 'bg-green-400' : 'bg-yellow-400'}`} />
              <p className="text-sm text-slate-300 leading-relaxed">{tip.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio value summary */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        <h2 className="text-base font-semibold text-white mb-3">Résumé du Portefeuille</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Valeur totale', value: fmt(totalValue) },
            { label: 'Coût total', value: fmt(totalCost) },
            { label: 'P&L latent', value: `+${fmt(totalValue - totalCost)}` },
            { label: 'Nb positions', value: positions.length.toString() },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-xs text-slate-400 mb-1">{item.label}</div>
              <div className="text-lg font-bold text-white">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
      <Sources sources={[
        { label: 'Beta & Volatilité — Investopedia', url: 'https://www.investopedia.com/terms/b/beta.asp', description: 'Définition du Beta et mesure de risque' },
        { label: 'Ratio de Sharpe — Investopedia', url: 'https://www.investopedia.com/terms/s/sharperatio.asp', description: 'Calcul et interprétation du ratio de Sharpe' },
        { label: 'Corrélations — MSCI', url: 'https://www.msci.com/research-and-insights/visualizing-investment-data/asset-class-correlations', description: 'Corrélations entre classes d\'actifs' },
        { label: 'Portfolio Visualizer', url: 'https://www.portfoliovisualizer.com/', description: 'Backtesting et analyse de risque de portefeuille' },
        { label: 'Max Drawdown — Investopedia', url: 'https://www.investopedia.com/terms/m/maximum-drawdown-mdd.asp', description: 'Définition et calcul du drawdown maximum' },
      ]} />
    </div>
  )
}

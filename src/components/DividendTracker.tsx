import { useState, useEffect } from 'react'
import { usePortfolioStore } from '../store/portfolioStore'
import Sources from './Sources'
import { useLiveQuotes } from '../hooks/useLiveQuotes'
import { fetchEurUsdRate } from '../services/marketData'
import { DIVIDEND_STOCKS, daysUntilExDate, needsDailyRefresh, markDividendRefreshed } from '../data/dividends'
import { RefreshCw, Star, Calendar, TrendingUp, Euro, AlertCircle } from 'lucide-react'

export default function DividendTracker() {
  const positions = usePortfolioStore((s) => s.positions)
  const [eurUsd, setEurUsd] = useState(1.08)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [filter, setFilter] = useState<'all' | 'portfolio' | 'pea'>('all')
  const [sortBy, setSortBy] = useState<'yield' | 'exdate' | 'income'>('yield')

  const tickers = DIVIDEND_STOCKS.map((d) => d.ticker)
  const { quotes, loading, refresh } = useLiveQuotes(tickers, false)

  useEffect(() => {
    fetchEurUsdRate().then(setEurUsd)
    // Auto-refresh at 7h00 Brussels daily
    if (needsDailyRefresh()) {
      refresh().then(() => {
        markDividendRefreshed()
        setLastRefresh(new Date())
      })
    }
    // Schedule next check in 1 hour
    const interval = setInterval(() => {
      if (needsDailyRefresh()) {
        refresh().then(() => {
          markDividendRefreshed()
          setLastRefresh(new Date())
        })
      }
    }, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    await refresh()
    markDividendRefreshed()
    setLastRefresh(new Date())
  }

  const portfolioTickers = new Set(positions.map((p) => p.ticker))

  const toEur = (amount: number, currency: string) =>
    currency === 'USD' ? amount / eurUsd : amount

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n)

  const fmtPct = (n: number) => `${n.toFixed(2)}%`

  // Build enriched list
  const enriched = DIVIDEND_STOCKS.map((d) => {
    const live = quotes.get(d.ticker)
    const currentPrice = live ? live.price : undefined
    const position = positions.find((p) => p.ticker === d.ticker)
    const qty = position?.quantity ?? 0
    const annualIncomeEur = toEur(d.annualDividend * qty, d.currency)
    const yieldLive = currentPrice
      ? (d.annualDividend / currentPrice) * 100
      : d.yieldPct
    return { ...d, currentPrice, qty, annualIncomeEur, yieldLive }
  })

  // Filter
  const filtered = enriched.filter((d) => {
    if (filter === 'portfolio') return portfolioTickers.has(d.ticker)
    if (filter === 'pea') return d.pea
    return true
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'yield') return b.yieldLive - a.yieldLive
    if (sortBy === 'exdate') return new Date(a.exDate).getTime() - new Date(b.exDate).getTime()
    if (sortBy === 'income') return b.annualIncomeEur - a.annualIncomeEur
    return 0
  })

  // Portfolio dividend summary
  const portfolioDivStocks = enriched.filter((d) => portfolioTickers.has(d.ticker) && d.qty > 0)
  const totalAnnualIncome = portfolioDivStocks.reduce((s, d) => s + d.annualIncomeEur, 0)
  const totalMonthlyIncome = totalAnnualIncome / 12
  const nextPayment = portfolioDivStocks
    .filter((d) => daysUntilExDate(d.exDate) > 0)
    .sort((a, b) => new Date(a.exDate).getTime() - new Date(b.exDate).getTime())[0]

  const summaryCards = [
    {
      label: 'Revenu Annuel Estimé',
      value: fmt(totalAnnualIncome),
      icon: <Euro size={20} className="text-green-400" />,
      sub: 'Dividendes en portefeuille',
      color: 'text-green-400',
    },
    {
      label: 'Revenu Mensuel Moyen',
      value: fmt(totalMonthlyIncome),
      icon: <TrendingUp size={20} className="text-indigo-400" />,
      sub: 'Moyenne lissée',
      color: 'text-white',
    },
    {
      label: 'Prochain Dividende',
      value: nextPayment ? nextPayment.ticker : '—',
      icon: <Calendar size={20} className="text-yellow-400" />,
      sub: nextPayment
        ? `Ex-date: ${new Date(nextPayment.exDate).toLocaleDateString('fr-FR')} (J-${Math.max(0, daysUntilExDate(nextPayment.exDate))})`
        : 'Aucun en portefeuille',
      color: 'text-yellow-400',
    },
    {
      label: 'Aristos en Portefeuille',
      value: portfolioDivStocks.filter((d) => d.aristocrat).length.toString(),
      icon: <Star size={20} className="text-amber-400" />,
      sub: '25+ ans de hausses consécutives',
      color: 'text-amber-400',
    },
  ]

  // Upcoming ex-dates (next 30 days)
  const upcoming = enriched
    .filter((d) => portfolioTickers.has(d.ticker) && daysUntilExDate(d.exDate) >= 0 && daysUntilExDate(d.exDate) <= 30)
    .sort((a, b) => daysUntilExDate(a.exDate) - daysUntilExDate(b.exDate))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dividende Tracker</h1>
          <p className="text-slate-400 text-sm mt-1">
            Suivi des dividendes — actualisation automatique chaque matin à 7h00 (Bruxelles)
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {lastRefresh
            ? `Mis à jour · ${lastRefresh.toLocaleTimeString('fr-FR', { timeStyle: 'short' })}`
            : 'Actualiser'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400">{c.label}</span>
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                {c.icon}
              </div>
            </div>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            <div className="text-slate-500 text-xs mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Upcoming ex-dates in portfolio */}
      {upcoming.length > 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-yellow-400" />
            <h2 className="text-sm font-semibold text-yellow-300">Ex-dates à venir (30 jours) — Acheter avant pour percevoir</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {upcoming.map((d) => {
              const days = daysUntilExDate(d.exDate)
              return (
                <div key={d.ticker} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700">
                  <span className="font-bold text-white text-sm">{d.ticker}</span>
                  <span className="text-slate-400 text-xs">{new Date(d.exDate).toLocaleDateString('fr-FR')}</span>
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${days <= 5 ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                    J-{days}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters & sort */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'portfolio', 'pea'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'portfolio' ? 'Mon Portfolio' : 'PEA Éligible'}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5"
        >
          <option value="yield">Trier: Rendement ↓</option>
          <option value="exdate">Trier: Ex-date ↑</option>
          <option value="income">Trier: Revenu portefeuille ↓</option>
        </select>
      </div>

      {/* Main table */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Ticker', 'Nom', 'Secteur', 'Dividende/An', 'Rendement', 'Fréquence', 'Ex-Date', 'Paiement', 'Consécutif', 'Revenu Portfolio', 'PEA'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => {
                const days = daysUntilExDate(d.exDate)
                const isInPortfolio = portfolioTickers.has(d.ticker)
                return (
                  <tr key={d.ticker} className={`border-b border-slate-700 hover:bg-slate-700/50 transition-colors ${isInPortfolio ? 'bg-indigo-900/10' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                          <span className="text-xs font-bold text-indigo-400">{d.ticker.slice(0, 2)}</span>
                        </div>
                        <span className="font-medium text-white">{d.ticker}</span>
                        {d.aristocrat && <span title="Dividend Aristocrat"><Star size={11} className="text-amber-400 fill-amber-400" /></span>}
                        {isInPortfolio && <span className="text-xs bg-indigo-600/30 text-indigo-300 px-1.5 py-0.5 rounded">En portefeuille</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{d.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-300">{d.sector}</span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{fmt(toEur(d.annualDividend, d.currency))}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${d.yieldLive >= 4 ? 'text-green-400' : d.yieldLive >= 2 ? 'text-yellow-400' : 'text-slate-300'}`}>
                        {fmtPct(d.yieldLive)}
                        {d.currentPrice && <span className="text-slate-500 text-xs ml-1">(live)</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{d.frequency}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${days >= 0 && days <= 7 ? 'text-red-400' : days >= 0 && days <= 30 ? 'text-yellow-400' : 'text-slate-300'}`}>
                        {new Date(d.exDate).toLocaleDateString('fr-FR')}
                        {days >= 0 && days <= 30 && <span className="ml-1 text-slate-500">(J-{days})</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(d.payDate).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                        {d.consecutive} ans
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.qty > 0 ? (
                        <span className="font-semibold text-green-400">{fmt(d.annualIncomeEur)}/an</span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {d.pea ? (
                        <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded font-medium">✓ PEA</span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calendar view — monthly income breakdown */}
      {portfolioDivStocks.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <h2 className="text-base font-semibold text-white mb-4">Calendrier des Paiements (Portefeuille)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((month, i) => {
              const monthIncome = portfolioDivStocks
                .filter((d) => {
                  if (d.frequency === 'Mensuel') return true
                  if (d.frequency === 'Trimestriel') return i % 3 === new Date(d.payDate).getMonth() % 3
                  if (d.frequency === 'Semestriel') return i % 6 === new Date(d.payDate).getMonth() % 6
                  return new Date(d.payDate).getMonth() === i
                })
                .reduce((s, d) => {
                  const freq = d.frequency === 'Mensuel' ? 1 : d.frequency === 'Trimestriel' ? 4 : d.frequency === 'Semestriel' ? 2 : 1
                  return s + d.annualIncomeEur / freq
                }, 0)
              const isCurrentMonth = i === new Date().getMonth()
              return (
                <div key={month} className={`rounded-lg p-3 border ${isCurrentMonth ? 'border-indigo-500/50 bg-indigo-900/20' : 'border-slate-700 bg-slate-900/40'}`}>
                  <div className="text-xs text-slate-400 font-medium mb-1">{month}</div>
                  <div className={`text-sm font-bold ${monthIncome > 0 ? 'text-green-400' : 'text-slate-600'}`}>
                    {monthIncome > 0 ? fmt(monthIncome) : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Sources sources={[
        { label: 'Dividendinvestor.com', url: 'https://www.dividendinvestor.com/', description: 'Base de données dividendes mondiale' },
        { label: 'S&P Dividend Aristocrats — ProShares', url: 'https://www.proshares.com/our-etfs/equity/nobl', description: 'Liste officielle des Dividend Aristocrats S&P 500' },
        { label: 'Euronext — Calendrier Dividendes', url: 'https://live.euronext.com/fr/products/dividends', description: 'Calendrier officiel dividendes Europe' },
        { label: 'TotalEnergies — Politique dividende', url: 'https://www.totalenergies.com/actionnaires/dividende', description: 'Politique de dividende TotalEnergies' },
        { label: 'Simply Safe Dividends', url: 'https://www.simplysafedividends.com/', description: 'Analyse de la sécurité des dividendes' },
        { label: 'Investopedia — Dividend Aristocrats', url: 'https://www.investopedia.com/terms/d/dividend-aristocrat.asp', description: 'Définition et liste des Dividend Aristocrats' },
      ]} />
    </div>
  )
}

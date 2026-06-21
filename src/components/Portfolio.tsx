import { useState, useCallback, useEffect } from 'react'
import { usePortfolioStore } from '../store/portfolioStore'
import { Position } from '../types'
import { Plus, Pencil, Trash2, X, Check, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import StockSearchInput from './StockSearchInput'
import { StockSearchResult } from '../data/stockDatabase'
import { fetchMultipleQuotes, fetchQuote, fetchEurUsdRate, isApiConfigured } from '../services/marketData'
import { appendPrice, getHistory, PricePoint } from '../services/priceHistory'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine,
} from 'recharts'

const LAST_UPDATE_KEY = 'portfolio_last_price_update'
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function getLastUpdateTs(): number {
  return parseInt(localStorage.getItem(LAST_UPDATE_KEY) || '0')
}

function markUpdated() {
  localStorage.setItem(LAST_UPDATE_KEY, Date.now().toString())
}

const EMPTY: Omit<Position, 'id'> = {
  ticker: '',
  name: '',
  quantity: 0,
  purchasePrice: 0,
  currentPrice: 0,
  currency: 'EUR',
  sector: '',
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function PriceHistoryChart({ ticker, quantity, purchasePrice, currency, version }: { ticker: string; quantity: number; purchasePrice: number; currency: string; version: number }) {
  const history: PricePoint[] = getHistory(ticker)
  void version

  const fmtVal = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency === 'USD' ? 'USD' : 'EUR', maximumFractionDigits: 0 }).format(n)

  if (history.length === 0) {
    return (
      <p className="text-xs text-slate-500 italic py-2">
        Pas encore de données — l'historique se construit à chaque mise à jour des cours.
      </p>
    )
  }

  if (history.length === 1) {
    const pt = history[0]
    const gain = Math.round((pt.price - purchasePrice) * quantity)
    return (
      <p className="text-xs text-slate-400 py-2">
        1 point enregistré le {formatDate(pt.ts)} — gain net : <strong className={gain >= 0 ? 'text-green-400' : 'text-red-400'}>{gain >= 0 ? '+' : ''}{fmtVal(gain)}</strong>.
        La courbe apparaîtra dès la prochaine mise à jour.
      </p>
    )
  }

  // Chart shows net gain = (price - purchasePrice) × quantity
  const data = history.map((pt) => ({
    date: formatDate(pt.ts),
    gain: Math.round((pt.price - purchasePrice) * quantity),
  }))
  const gains = data.map((d) => d.gain)
  const minG = Math.min(...gains)
  const maxG = Math.max(...gains)
  const currentGain = gains[gains.length - 1]
  const firstGain = gains[0]
  const rising = currentGain >= firstGain
  const positive = currentGain >= 0
  const color = positive ? '#22c55e' : '#f87171'
  const pct = ((history[history.length - 1].price - purchasePrice) / purchasePrice * 100)

  return (
    <div className="mt-3">
      <div className="flex items-center gap-5 mb-2 text-xs text-slate-400 flex-wrap">
        <span>Gain actuel : <strong className={positive ? 'text-green-400' : 'text-red-400'}>{currentGain >= 0 ? '+' : ''}{fmtVal(currentGain)} ({pct >= 0 ? '+' : ''}{pct.toFixed(2)}%)</strong></span>
        <span>Max gain : <strong className="text-slate-200">{fmtVal(maxG)}</strong></span>
        <span>Min gain : <strong className="text-slate-200">{fmtVal(minG)}</strong></span>
        <span className={rising ? 'text-green-400' : 'text-red-400'}>
          {rising ? '▲' : '▼'} tendance sur la période
        </span>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[Math.min(minG, 0) - Math.abs(minG) * 0.1, maxG + Math.abs(maxG) * 0.1]} hide />
          <Tooltip
            contentStyle={{ background: 'var(--tooltip-bg)', border: 'none', borderRadius: '8px', fontSize: '11px', color: 'var(--text-primary)' }}
            itemStyle={{ color: 'var(--text-primary)' }}
            formatter={(v: number) => [`${v >= 0 ? '+' : ''}${fmtVal(v)}`, 'Gain net']}
          />
          <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 3" strokeWidth={1} />
          <Area
            type="monotone"
            dataKey="gain"
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${ticker})`}
            dot={false}
            activeDot={{ r: 3, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-600 mt-1">— Ligne pointillée = seuil de rentabilité (0) · {history.length} point{history.length > 1 ? 's' : ''}</p>
    </div>
  )
}

export default function Portfolio() {
  const { positions, addPosition, updatePosition, removePosition } = usePortfolioStore()
  const [modal, setModal] = useState<{ type: 'add' | 'edit'; data: Omit<Position, 'id'>; id?: string } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [autoFilled, setAutoFilled] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState('')
  const [eurUsd, setEurUsd] = useState(1.08)
  const [fetchingLivePrice, setFetchingLivePrice] = useState(false)
  const [showUpdateReminder, setShowUpdateReminder] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [historyVersion, setHistoryVersion] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (isApiConfigured()) fetchEurUsdRate().then(setEurUsd)
    const ts = getLastUpdateTs()
    if (ts === 0 || Date.now() - ts > WEEK_MS) setShowUpdateReminder(true)
  }, [])

  const toEur = (amount: number, currency: string) =>
    currency === 'USD' ? amount / eurUsd : amount

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n)

  const totalValue = positions.reduce((s, p) => s + toEur(p.quantity * p.currentPrice, p.currency), 0)
  const totalCost = positions.reduce((s, p) => s + toEur(p.quantity * p.purchasePrice, p.currency), 0)
  const totalPnL = totalValue - totalCost

  const handleSave = () => {
    if (!modal) return
    if (modal.type === 'add') {
      addPosition(modal.data)
      if (modal.data.currentPrice > 0) {
        appendPrice(modal.data.ticker, modal.data.currentPrice)
        setHistoryVersion((v) => v + 1)
      }
    } else if (modal.id) {
      const prev = positions.find((p) => p.id === modal.id)
      updatePosition(modal.id, modal.data)
      if (prev && modal.data.currentPrice !== prev.currentPrice) {
        appendPrice(modal.data.ticker, modal.data.currentPrice)
        markUpdated()
        setShowUpdateReminder(false)
        setHistoryVersion((v) => v + 1)
        const pts = getHistory(modal.data.ticker).length
        showToast(`${modal.data.ticker} mis à jour · ${pts} point${pts > 1 ? 's' : ''} dans l'historique`)
      }
    }
    setModal(null)
    setAutoFilled(false)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const handleSelectStock = useCallback(async (stock: StockSearchResult) => {
    setModal((m) =>
      m
        ? {
            ...m,
            data: {
              ...m.data,
              ticker: stock.ticker,
              name: stock.name,
              sector: stock.sector,
              currency: stock.currency,
              currentPrice: stock.currentPrice,
              pea: stock.pea,
            },
          }
        : m
    )
    setAutoFilled(true)
    if (isApiConfigured()) {
      setFetchingLivePrice(true)
      const live = await fetchQuote(stock.ticker)
      if (live) {
        setModal((m) =>
          m ? { ...m, data: { ...m.data, currentPrice: live.price } } : m
        )
      }
      setFetchingLivePrice(false)
    }
  }, [])

  const handleRefreshPrices = async () => {
    if (!isApiConfigured()) {
      setRefreshMsg('Configurez votre clé Finnhub pour activer le cours en temps réel.')
      setTimeout(() => setRefreshMsg(''), 4000)
      return
    }
    setRefreshing(true)
    setRefreshMsg('Mise à jour des cours…')
    const tickers = positions.map((p) => p.ticker)
    const quotes = await fetchMultipleQuotes(tickers)
    let updated = 0
    quotes.forEach((q, ticker) => {
      const pos = positions.find((p) => p.ticker === ticker)
      if (pos) {
        updatePosition(pos.id, { currentPrice: q.price })
        appendPrice(ticker, q.price)
        updated++
      }
    })
    setRefreshing(false)
    if (updated > 0) {
      markUpdated()
      setShowUpdateReminder(false)
      setHistoryVersion((v) => v + 1)
      showToast(`${updated} cours mis à jour · historique enregistré`)
    }
    setRefreshMsg(updated > 0 ? `${updated} cours mis à jour ✓` : 'Aucune donnée disponible.')
    setTimeout(() => setRefreshMsg(''), 4000)
  }

  const renderField = (label: string, key: keyof Omit<Position, 'id'>, type = 'text') => (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      {key === 'currency' ? (
        <select
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white"
          value={(modal?.data[key] as string) || 'EUR'}
          onChange={(e) => setModal((m) => m ? { ...m, data: { ...m.data, [key]: e.target.value as 'USD' | 'EUR' } } : m)}
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      ) : (
        <input
          type={type}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent"
          value={modal?.data[key] as string | number || ''}
          onChange={(e) =>
            setModal((m) =>
              m ? { ...m, data: { ...m.data, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value } } : m
            )
          }
        />
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mon Portfolio</h1>
          <p className="text-slate-400 text-sm mt-1">Ajoutez vos titres via la recherche (actions, ETF, PEA), suivez prix d'achat, valeur actuelle et P&L en euros. Cliquez sur une ligne pour voir l'historique des cours.</p>
        </div>
        <div className="flex items-center gap-3">
          {refreshMsg && <span className="text-xs text-slate-400">{refreshMsg}</span>}
          <button
            onClick={handleRefreshPrices}
            disabled={refreshing}
            title="Mettre à jour les cours (requiert clé Finnhub)"
            className="flex items-center gap-2 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Actualiser
          </button>
          <button
            onClick={() => { setModal({ type: 'add', data: { ...EMPTY } }); setAutoFilled(false) }}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ color: "#ffffff" }}
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>
      </div>

      {/* Weekly update reminder */}
      {showUpdateReminder && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm">
          <AlertCircle size={16} className="shrink-0 text-yellow-400" />
          <span className="flex-1">
            Il y a plus d'une semaine que vous n'avez pas mis à jour vos cours.
            Cliquez <strong>Actualiser</strong> pour récupérer les prix en temps réel via Finnhub, ou mettez à jour manuellement chaque position.
          </span>
          <button
            onClick={() => { markUpdated(); setShowUpdateReminder(false) }}
            className="text-yellow-400 hover:text-yellow-200 shrink-0"
            title="Fermer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['', 'Ticker', 'Nom', 'Secteur', 'Qté', 'Prix Achat', 'Prix Actuel', 'Valeur', 'P&L', 'Rend.', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const value = toEur(p.quantity * p.currentPrice, p.currency)
                const pnl = toEur(p.quantity * (p.currentPrice - p.purchasePrice), p.currency)
                const ret = ((p.currentPrice - p.purchasePrice) / p.purchasePrice) * 100
                const isExpanded = expandedId === p.id
                const historyLen = getHistory(p.ticker).length
                return (
                  <>
                    <tr
                      key={p.id}
                      className={`border-b border-slate-700 cursor-pointer transition-colors ${isExpanded ? 'bg-slate-700/40' : 'hover:bg-slate-700/30'}`}
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    >
                      <td className="px-3 py-3 text-slate-500">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-accent/20 border border-accent/30 flex items-center justify-center">
                            <span className="text-xs font-bold text-accent/80">{p.ticker.slice(0, 2)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-white">{p.ticker}</span>
                            {historyLen > 0 && (
                              <span className="ml-1.5 text-xs text-slate-500">{historyLen}pt</span>
                            )}
                          </div>
                          {p.currency === 'USD' && <span className="text-xs text-slate-500">$→€</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{p.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-300">{p.sector}</span>
                          {p.pea && <span className="px-1.5 py-0.5 rounded text-xs bg-green-500/20 text-green-300 font-medium">PEA</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{p.quantity}</td>
                      <td className="px-4 py-3 text-slate-300">{fmt(toEur(p.purchasePrice, p.currency))}</td>
                      <td className="px-4 py-3 text-white font-medium">{fmt(toEur(p.currentPrice, p.currency))}</td>
                      <td className="px-4 py-3 text-white font-semibold">{fmt(value)}</td>
                      <td className={`px-4 py-3 font-medium ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}{fmt(pnl)}
                      </td>
                      <td className={`px-4 py-3 font-medium ${ret >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {ret >= 0 ? '+' : ''}{ret.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { setModal({ type: 'edit', data: { ticker: p.ticker, name: p.name, quantity: p.quantity, purchasePrice: p.purchasePrice, currentPrice: p.currentPrice, currency: p.currency, sector: p.sector }, id: p.id }); setAutoFilled(false) }}
                            className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteId(p.id)}
                            className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${p.id}-detail`} className="border-b" style={{ background: "var(--card-bg-2)", borderColor: "var(--card-border)" }}>
                        <td colSpan={11} className="px-6 py-4">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Historique du cours — {p.ticker}
                          </p>
                          <PriceHistoryChart
                            ticker={p.ticker}
                            quantity={p.quantity}
                            purchasePrice={p.purchasePrice}
                            currency={p.currency}
                            version={historyVersion}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "var(--card-bg-2)", borderTop: "2px solid var(--card-border)" }}>
                <td colSpan={7} className="px-4 py-3 font-semibold text-slate-300">TOTAL</td>
                <td className="px-4 py-3 font-bold text-white">{fmt(totalValue)}</td>
                <td className={`px-4 py-3 font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalPnL >= 0 ? '+' : ''}{fmt(totalPnL)}
                </td>
                <td className={`px-4 py-3 font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {((totalPnL / totalCost) * 100).toFixed(2)}%
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                {modal.type === 'add' ? 'Ajouter une position' : 'Modifier la position'}
              </h2>
              <button onClick={() => { setModal(null); setAutoFilled(false) }} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Search — only in add mode */}
            {modal.type === 'add' && (
              <div className="mb-4">
                <StockSearchInput onSelect={handleSelectStock} />
                {autoFilled && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs">
                    {fetchingLivePrice ? (
                      <><RefreshCw size={12} className="animate-spin text-accent/80" /><span className="text-accent/80">Récupération du cours en temps réel…</span></>
                    ) : (
                      <><Check size={12} className="text-green-400" /><span className="text-green-400">Données importées — vérifiez et complétez si besoin</span></>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {renderField('Ticker', 'ticker')}
              {renderField('Devise', 'currency')}
              {renderField('Nom complet', 'name')}
              {renderField('Secteur', 'sector')}
              {renderField('Quantité', 'quantity', 'number')}
              {renderField("Prix d'achat", 'purchasePrice', 'number')}
              {renderField('Prix actuel', 'currentPrice', 'number')}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setModal(null); setAutoFilled(false) }}
                className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 text-sm transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 rounded-lg bg-accent hover:bg-accent-hover text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                style={{ color: '#ffffff' }}
              >
                <Check size={16} />
                {modal.type === 'add' ? 'Ajouter' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-800 border border-green-500/40 text-green-300 text-sm px-4 py-3 rounded-xl shadow-xl animate-fade-in">
          <Check size={15} className="text-green-400 shrink-0" />
          {toast}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Confirmer la suppression</h2>
            <p className="text-slate-400 text-sm mb-6">Êtes-vous sûr de vouloir supprimer cette position ? Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white text-sm transition-colors">Annuler</button>
              <button
                onClick={() => { removePosition(deleteId); setDeleteId(null) }}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-medium transition-colors"
                style={{ color: '#ffffff' }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

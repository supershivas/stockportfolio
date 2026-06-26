import { usePortfolioStore } from '../store/portfolioStore'
import { Transaction } from '../types'
import { TrendingUp, TrendingDown, X, ArrowUpDown } from 'lucide-react'

const TYPE_CONFIG = {
  buy:   { label: 'Achat',     color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  icon: <TrendingUp  size={12} /> },
  sell:  { label: 'Vente',     color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  icon: <TrendingDown size={12} /> },
  close: { label: 'Clôture',   color: '#f87171', bg: 'rgba(248,113,113,0.1)', icon: <X size={12} /> },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

export default function TransactionHistory() {
  const transactions = usePortfolioStore((s) => s.transactions)

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-8 text-center">
        <ArrowUpDown size={24} className="text-slate-600 mx-auto mb-3" />
        <div className="text-slate-400 text-sm">Aucune transaction enregistrée.</div>
        <div className="text-slate-600 text-xs mt-1">Les achats, ventes et clôtures apparaîtront ici automatiquement.</div>
      </div>
    )
  }

  // Stats
  const buys  = transactions.filter(t => t.type === 'buy')
  const sells = transactions.filter(t => t.type === 'sell' || t.type === 'close')
  const totalPnl = sells.reduce((s, t) => s + (t.pnlEur ?? 0), 0)
  const totalInvested = buys.reduce((s, t) => {
    const eur = t.currency === 'USD' ? t.quantity * t.price / 1.08 : t.quantity * t.price
    return s + eur
  }, 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="text-xs text-slate-400 mb-1">Opérations</div>
          <div className="text-xl font-bold text-white">{transactions.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">{buys.length} achats · {sells.length} ventes/clôtures</div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="text-xs text-slate-400 mb-1">Total investi</div>
          <div className="text-xl font-bold text-white">{fmtEur(totalInvested)}</div>
          <div className="text-xs text-slate-500 mt-0.5">Achats cumulés (€)</div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="text-xs text-slate-400 mb-1">P&L réalisé</div>
          <div className={`text-xl font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnl >= 0 ? '+' : ''}{fmtEur(totalPnl)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Ventes + clôtures</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Date', 'Type', 'Ticker', 'Quantité', 'Prix / action', 'Valeur totale', 'P&L réalisé'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx: Transaction) => {
                const cfg = TYPE_CONFIG[tx.type]
                const totalEur = tx.currency === 'USD'
                  ? tx.quantity * tx.price / 1.08
                  : tx.quantity * tx.price
                return (
                  <tr key={tx.id} className="border-b border-slate-700/60 hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{fmtDate(tx.date)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-accent/80">{tx.ticker.slice(0, 2)}</span>
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm">{tx.ticker}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{tx.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono">{tx.quantity}</td>
                    <td className="px-4 py-3 text-slate-300 font-mono">
                      {tx.price.toFixed(2)} {tx.currency}
                      {tx.purchasePrice != null && tx.type !== 'buy' && (
                        <div className="text-[10px] text-slate-500">achat: {tx.purchasePrice.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{fmtEur(totalEur)}</td>
                    <td className="px-4 py-3">
                      {tx.pnlEur != null ? (
                        <span className={`font-semibold ${tx.pnlEur >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.pnlEur >= 0 ? '+' : ''}{fmtEur(tx.pnlEur)}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

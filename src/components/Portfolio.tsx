import { useState } from 'react'
import { usePortfolioStore } from '../store/portfolioStore'
import { Position } from '../types'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'

const EMPTY: Omit<Position, 'id'> = {
  ticker: '',
  name: '',
  quantity: 0,
  purchasePrice: 0,
  currentPrice: 0,
  currency: 'USD',
  sector: '',
}

export default function Portfolio() {
  const { positions, addPosition, updatePosition, removePosition } = usePortfolioStore()
  const [modal, setModal] = useState<{ type: 'add' | 'edit'; data: Omit<Position, 'id'>; id?: string } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fmt = (n: number, cur = 'USD') =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(n)

  const totalValue = positions.reduce((s, p) => s + p.quantity * p.currentPrice, 0)
  const totalCost = positions.reduce((s, p) => s + p.quantity * p.purchasePrice, 0)
  const totalPnL = totalValue - totalCost

  const handleSave = () => {
    if (!modal) return
    if (modal.type === 'add') {
      addPosition(modal.data)
    } else if (modal.id) {
      updatePosition(modal.id, modal.data)
    }
    setModal(null)
  }

  const renderField = (label: string, key: keyof Omit<Position, 'id'>, type = 'text') => (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      {key === 'currency' ? (
        <select
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white"
          value={(modal?.data[key] as string) || 'USD'}
          onChange={(e) => setModal((m) => m ? { ...m, data: { ...m.data, [key]: e.target.value as 'USD' | 'EUR' } } : m)}
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      ) : (
        <input
          type={type}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
          <p className="text-slate-400 text-sm mt-1">Gérez vos positions boursières</p>
        </div>
        <button
          onClick={() => setModal({ type: 'add', data: { ...EMPTY } })}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Ticker', 'Nom', 'Secteur', 'Qté', 'Prix Achat', 'Prix Actuel', 'Valeur', 'P&L', 'Rend.', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const value = p.quantity * p.currentPrice
                const pnl = p.quantity * (p.currentPrice - p.purchasePrice)
                const ret = ((p.currentPrice - p.purchasePrice) / p.purchasePrice) * 100
                return (
                  <tr key={p.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                          <span className="text-xs font-bold text-indigo-400">{p.ticker.slice(0, 2)}</span>
                        </div>
                        <span className="font-medium text-white">{p.ticker}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-300">{p.sector}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{p.quantity}</td>
                    <td className="px-4 py-3 text-slate-300">{fmt(p.purchasePrice, p.currency)}</td>
                    <td className="px-4 py-3 text-white font-medium">{fmt(p.currentPrice, p.currency)}</td>
                    <td className="px-4 py-3 text-white font-semibold">{fmt(value, p.currency)}</td>
                    <td className={`px-4 py-3 font-medium ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pnl >= 0 ? '+' : ''}{fmt(pnl, p.currency)}
                    </td>
                    <td className={`px-4 py-3 font-medium ${ret >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {ret >= 0 ? '+' : ''}{ret.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setModal({ type: 'edit', data: { ticker: p.ticker, name: p.name, quantity: p.quantity, purchasePrice: p.purchasePrice, currentPrice: p.currentPrice, currency: p.currency, sector: p.sector }, id: p.id })}
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
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900/60 border-t-2 border-slate-600">
                <td colSpan={6} className="px-4 py-3 font-semibold text-slate-300">TOTAL</td>
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
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                {modal.type === 'add' ? 'Ajouter une position' : 'Modifier la position'}
              </h2>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
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
                onClick={() => setModal(null)}
                className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 text-sm transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Check size={16} />
                {modal.type === 'add' ? 'Ajouter' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Confirmer la suppression</h2>
            <p className="text-slate-400 text-sm mb-6">Êtes-vous sûr de vouloir supprimer cette position ? Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white text-sm transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => { removePosition(deleteId); setDeleteId(null) }}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
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

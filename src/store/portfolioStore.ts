import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Position, Transaction } from '../types';
import { syncToCloud } from '../services/cloudBackup';

interface PortfolioState {
  positions: Position[];
  transactions: Transaction[];
  addPosition: (p: Omit<Position, 'id'>) => void;
  updatePosition: (id: string, p: Partial<Position>) => void;
  removePosition: (id: string) => void;
  setPositions: (positions: Position[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
}

function makeId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      positions: [],
      transactions: [],

      addPosition: (p) => set((s) => {
        const position: Position = { ...p, id: Date.now().toString() }
        const tx: Transaction = {
          id: makeId(),
          date: new Date().toISOString(),
          type: 'buy',
          ticker: p.ticker,
          name: p.name,
          quantity: p.quantity,
          price: p.purchasePrice,
          currency: p.currency,
        }
        const positions = [...s.positions, position]
        const transactions = [tx, ...s.transactions]
        syncToCloud(positions, transactions)
        return { positions, transactions }
      }),

      updatePosition: (id, p) => set((s) => {
        const existing = s.positions.find((pos) => pos.id === id)
        const positions = s.positions.map((pos) => pos.id === id ? { ...pos, ...p } : pos)

        let transactions = s.transactions
        if (existing && p.quantity != null && p.quantity !== existing.quantity) {
          const delta = p.quantity - existing.quantity
          const price = p.currentPrice ?? existing.currentPrice
          const pricePurchase = existing.purchasePrice
          const eurRate = existing.currency === 'USD' ? 1 / 1.08 : 1
          const tx: Transaction = {
            id: makeId(),
            date: new Date().toISOString(),
            type: delta > 0 ? 'buy' : 'sell',
            ticker: existing.ticker,
            name: existing.name,
            quantity: Math.abs(delta),
            price,
            currency: existing.currency,
            purchasePrice: pricePurchase,
            pnlEur: delta < 0 ? Math.round((price - pricePurchase) * Math.abs(delta) * eurRate) : undefined,
          }
          transactions = [tx, ...s.transactions]
        }

        syncToCloud(positions, transactions)
        return { positions, transactions }
      }),

      removePosition: (id) => set((s) => {
        const existing = s.positions.find((p) => p.id === id)
        const positions = s.positions.filter((p) => p.id !== id)

        let transactions = s.transactions
        if (existing) {
          const eurRate = existing.currency === 'USD' ? 1 / 1.08 : 1
          const tx: Transaction = {
            id: makeId(),
            date: new Date().toISOString(),
            type: 'close',
            ticker: existing.ticker,
            name: existing.name,
            quantity: existing.quantity,
            price: existing.currentPrice,
            currency: existing.currency,
            purchasePrice: existing.purchasePrice,
            pnlEur: Math.round((existing.currentPrice - existing.purchasePrice) * existing.quantity * eurRate),
          }
          transactions = [tx, ...s.transactions]
        }

        syncToCloud(positions, transactions)
        return { positions, transactions }
      }),

      setPositions: (positions) => {
        const { transactions } = get()
        set({ positions })
        syncToCloud(positions, transactions)
      },

      setTransactions: (transactions) => set({ transactions }),
    }),
    { name: 'portfolio-storage' }
  )
);

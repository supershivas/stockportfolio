import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Position } from '../types';

const DEFAULT_POSITIONS: Position[] = [
  { id: '1', ticker: 'AAPL', name: 'Apple Inc.', quantity: 10, purchasePrice: 150, currentPrice: 189, currency: 'USD', sector: 'Technologie' },
  { id: '2', ticker: 'MSFT', name: 'Microsoft Corp.', quantity: 8, purchasePrice: 280, currentPrice: 375, currency: 'USD', sector: 'Technologie' },
  { id: '3', ticker: 'NVDA', name: 'NVIDIA Corp.', quantity: 5, purchasePrice: 220, currentPrice: 495, currency: 'USD', sector: 'Semiconducteurs' },
  { id: '4', ticker: 'MC.PA', name: 'LVMH', quantity: 3, purchasePrice: 750, currentPrice: 820, currency: 'EUR', sector: 'Luxe' },
  { id: '5', ticker: 'CW8.PA', name: 'MSCI World ETF', quantity: 50, purchasePrice: 35, currentPrice: 42, currency: 'EUR', sector: 'ETF Monde' },
  { id: '6', ticker: 'PE500.PA', name: 'S&P 500 ETF', quantity: 20, purchasePrice: 45, currentPrice: 52, currency: 'EUR', sector: 'ETF USA' },
];

interface PortfolioState {
  positions: Position[];
  addPosition: (p: Omit<Position, 'id'>) => void;
  updatePosition: (id: string, p: Partial<Position>) => void;
  removePosition: (id: string) => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      positions: DEFAULT_POSITIONS,
      addPosition: (p) => set((s) => ({ positions: [...s.positions, { ...p, id: Date.now().toString() }] })),
      updatePosition: (id, p) => set((s) => ({ positions: s.positions.map((pos) => pos.id === id ? { ...pos, ...p } : pos) })),
      removePosition: (id) => set((s) => ({ positions: s.positions.filter((p) => p.id !== id) })),
    }),
    { name: 'portfolio-storage' }
  )
);

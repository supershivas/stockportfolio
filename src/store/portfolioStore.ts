import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Position } from '../types';

const DEFAULT_POSITIONS: Position[] = [
  { id: '1', ticker: 'AAPL',    name: 'Apple Inc.',        quantity: 10, purchasePrice: 150, currentPrice: 200,  currency: 'USD', sector: 'Technologie',   pea: false },
  { id: '2', ticker: 'MSFT',    name: 'Microsoft Corp.',   quantity: 8,  purchasePrice: 280, currentPrice: 420,  currency: 'USD', sector: 'Technologie',   pea: false },
  { id: '3', ticker: 'NVDA',    name: 'NVIDIA Corp.',      quantity: 5,  purchasePrice: 220, currentPrice: 130,  currency: 'USD', sector: 'Semiconducteurs',pea: false },
  { id: '4', ticker: 'MC.PA',   name: 'LVMH',              quantity: 3,  purchasePrice: 750, currentPrice: 680,  currency: 'EUR', sector: 'Luxe',          pea: true  },
  { id: '5', ticker: 'CW8.PA',  name: 'Amundi MSCI World', quantity: 50, purchasePrice: 380, currentPrice: 450,  currency: 'EUR', sector: 'ETF Monde',     pea: true  },
  { id: '6', ticker: 'PE500.PA',name: 'Amundi S&P 500 ETF',quantity: 20, purchasePrice: 30,  currentPrice: 38,   currency: 'EUR', sector: 'ETF USA',       pea: true  },
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

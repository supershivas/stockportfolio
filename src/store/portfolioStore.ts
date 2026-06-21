import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Position } from '../types';

interface PortfolioState {
  positions: Position[];
  addPosition: (p: Omit<Position, 'id'>) => void;
  updatePosition: (id: string, p: Partial<Position>) => void;
  removePosition: (id: string) => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      positions: [],
      addPosition: (p) => set((s) => ({ positions: [...s.positions, { ...p, id: Date.now().toString() }] })),
      updatePosition: (id, p) => set((s) => ({ positions: s.positions.map((pos) => pos.id === id ? { ...pos, ...p } : pos) })),
      removePosition: (id) => set((s) => ({ positions: s.positions.filter((p) => p.id !== id) })),
    }),
    { name: 'portfolio-storage' }
  )
);

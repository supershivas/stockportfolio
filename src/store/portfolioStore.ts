import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Position } from '../types';
import { syncToCloud } from '../services/cloudBackup';

interface PortfolioState {
  positions: Position[];
  addPosition: (p: Omit<Position, 'id'>) => void;
  updatePosition: (id: string, p: Partial<Position>) => void;
  removePosition: (id: string) => void;
  setPositions: (positions: Position[]) => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      positions: [],
      addPosition: (p) => set((s) => {
        const positions = [...s.positions, { ...p, id: Date.now().toString() }]
        syncToCloud(positions)
        return { positions }
      }),
      updatePosition: (id, p) => set((s) => {
        const positions = s.positions.map((pos) => pos.id === id ? { ...pos, ...p } : pos)
        syncToCloud(positions)
        return { positions }
      }),
      removePosition: (id) => set((s) => {
        const positions = s.positions.filter((p) => p.id !== id)
        syncToCloud(positions)
        return { positions }
      }),
      setPositions: (positions) => { set({ positions }); syncToCloud(positions) },
    }),
    { name: 'portfolio-storage' }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Position } from '../types';
import { syncToCloud } from '../services/cloudBackup';

// Debounce helper
let syncTimer: ReturnType<typeof setTimeout> | null = null
function debouncedSync(positions: Position[]) {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    syncToCloud(positions)
  }, 3000)
}

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
        debouncedSync(positions)
        return { positions }
      }),
      updatePosition: (id, p) => set((s) => {
        const positions = s.positions.map((pos) => pos.id === id ? { ...pos, ...p } : pos)
        debouncedSync(positions)
        return { positions }
      }),
      removePosition: (id) => set((s) => {
        const positions = s.positions.filter((p) => p.id !== id)
        debouncedSync(positions)
        return { positions }
      }),
      setPositions: (positions) => { set({ positions }); debouncedSync(positions) },
    }),
    { name: 'portfolio-storage' }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ClaudeModel = 'sonnet' | 'opus';

interface ModelState {
  model: ClaudeModel;
  setModel: (model: ClaudeModel) => void;
}

export const useModelStore = create<ModelState>()(
  persist(
    (set) => ({
      model: 'sonnet',
      setModel: (model) => set({ model }),
    }),
    { name: 'claude-model' }
  )
);

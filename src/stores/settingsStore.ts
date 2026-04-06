import { create } from 'zustand';

import type { Settings } from '../types';
import * as api from '../services/api';

interface SettingsState {
  settings: Settings | null;
  loading: boolean;
  fetch: () => Promise<void>;
  update: (data: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  loading: true,
  fetch: async () => {
    set({ loading: true });
    const settings = await api.getSettings();
    set({ settings, loading: false });
  },
  update: async (data) => {
    const settings = await api.updateSettings(data);
    set({ settings });
  },
}));

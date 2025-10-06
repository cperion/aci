import { create } from 'zustand';
import type { Notice, NoticeLevel } from '../data/types';

interface UiState {
  overlays: {
    help: boolean;
    palette: boolean;
    search: boolean;
  };
  theme: {
    scheme: string;
  };
  notices: Notice[];
}

interface UiActions {
  showOverlay: (name: keyof UiState['overlays']) => void;
  hideOverlay: (name: keyof UiState['overlays']) => void;
  toggleOverlay: (name: keyof UiState['overlays']) => void;
  setTheme: (scheme: string) => void;
  pushNotice: (notice: Omit<Notice, 'id' | 'ts'>) => void;
  removeNotice: (id: string) => void;
  clearNotices: () => void;
}

export type UiSlice = UiState & UiActions;

export const useUiStore = create<UiSlice>((set, get) => ({
  // Initial state
  overlays: {
    help: false,
    palette: false,
    search: false,
  },
  theme: {
    scheme: 'default-dark',
  },
  notices: [],

  showOverlay: (name: keyof UiState['overlays']) => {
    set((state) => ({
      overlays: { ...state.overlays, [name]: true },
    }));
  },

  hideOverlay: (name: keyof UiState['overlays']) => {
    set((state) => ({
      overlays: { ...state.overlays, [name]: false },
    }));
  },

  toggleOverlay: (name: keyof UiState['overlays']) => {
    set((state) => ({
      overlays: { ...state.overlays, [name]: !state.overlays[name] },
    }));
  },

  setTheme: (scheme: string) => {
    set((state) => ({
      theme: { ...state.theme, scheme },
    }));
  },

  pushNotice: (notice: Omit<Notice, 'id' | 'ts'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const fullNotice: Notice = {
      ...notice,
      id,
      ts: Date.now(),
    };

    set((state) => ({
      notices: [...state.notices, fullNotice],
    }));

    // Auto-remove success/info notices after 5 seconds
    if (notice.level === 'success' || notice.level === 'info') {
      setTimeout(() => {
        get().removeNotice(id);
      }, 5000);
    }
  },

  removeNotice: (id: string) => {
    set((state) => ({
      notices: state.notices.filter(n => n.id !== id),
    }));
  },

  clearNotices: () => {
    set({ notices: [] });
  },
}));
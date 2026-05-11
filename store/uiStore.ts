import { create } from 'zustand';

interface UIState {
  isChatOpen: boolean;
  toggleChat: () => void;
  closeChat: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isChatOpen: false,
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  closeChat: () => set({ isChatOpen: false }),
}));
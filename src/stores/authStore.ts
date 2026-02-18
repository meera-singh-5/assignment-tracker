import { create } from 'zustand';
import type { AccountInfo } from '../types/assignment';

interface AuthState {
  accounts: AccountInfo[];
  loading: boolean;
  checkStatus: () => Promise<void>;
  addAccount: () => Promise<void>;
  removeAccount: (email: string) => Promise<void>;
  toggleAccount: (email: string, enabled: boolean) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accounts: [],
  loading: true,

  checkStatus: async () => {
    set({ loading: true });
    try {
      const status = await window.api.auth.getStatus();
      set({ accounts: status.accounts, loading: false });
    } catch {
      set({ accounts: [], loading: false });
    }
  },

  addAccount: async () => {
    set({ loading: true });
    try {
      const status = await window.api.auth.login();
      set({ accounts: status.accounts, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  removeAccount: async (email: string) => {
    await window.api.auth.logout(email);
    const status = await window.api.auth.getStatus();
    set({ accounts: status.accounts });
  },

  toggleAccount: async (email: string, enabled: boolean) => {
    await window.api.auth.toggleAccount(email, enabled);
    set(state => ({
      accounts: state.accounts.map(acc =>
        acc.email === email ? { ...acc, enabled } : acc
      ),
    }));
  },
}));

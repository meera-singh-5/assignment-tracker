import { create } from 'zustand';
import type { AccountInfo } from '../types/assignment';

const LOGIN_TIMEOUT_MS = 90_000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

interface AuthState {
  accounts: AccountInfo[];
  loading: boolean;
  signingIn: boolean;
  error: string | null;
  checkStatus: () => Promise<void>;
  addAccount: () => Promise<void>;
  cancelSignIn: () => void;
  removeAccount: (email: string) => Promise<void>;
  toggleAccount: (email: string, enabled: boolean) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accounts: [],
  loading: true,
  signingIn: false,
  error: null,

  checkStatus: async () => {
    set({ loading: true, error: null });
    try {
      const status = await window.api.auth.getStatus();
      set({ accounts: status.accounts, loading: false });
    } catch {
      set({ accounts: [], loading: false });
    }
  },

  addAccount: async () => {
    set({ signingIn: true, error: null });
    try {
      const status = await withTimeout(
        window.api.auth.login(),
        LOGIN_TIMEOUT_MS,
        'Sign-in timed out. Please try again.'
      );
      set({ accounts: status.accounts, signingIn: false });
    } catch (err) {
      // If the user already cancelled, signingIn is already false — don't
      // resurrect an error screen for the rejection that cancellation caused.
      if (!get().signingIn) return;
      set({
        signingIn: false,
        error: err instanceof Error ? err.message : 'Sign-in failed. Please try again.',
      });
    }
  },

  cancelSignIn: () => {
    set({ signingIn: false });
    window.api.auth.cancelLogin().catch(() => {});
  },

  clearError: () => set({ error: null }),

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

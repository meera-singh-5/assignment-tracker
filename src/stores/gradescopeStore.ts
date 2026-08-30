import { create } from 'zustand';

interface GradescopeState {
  email: string | null;
  loggedIn: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useGradescopeStore = create<GradescopeState>((set) => ({
  email: null,
  loggedIn: false,
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const result = await window.api.gradescope.login(email, password);
      set({ loggedIn: true, email: result.email, loading: false });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'Login failed.' });
    }
  },

  logout: async () => {
    await window.api.gradescope.logout();
    set({ loggedIn: false, email: null, error: null });
  },
}));

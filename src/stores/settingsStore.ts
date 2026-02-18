import { create } from 'zustand';

interface SettingsState {
  scanStartDate: string;
  scanFrequencyMinutes: number;
  theme: 'light' | 'dark';
  lastScanAt: string | null;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Record<string, string>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  scanStartDate: '',
  scanFrequencyMinutes: 30,
  theme: 'light',
  lastScanAt: null,

  loadSettings: async () => {
    try {
      const settings = await window.api.settings.get() as Record<string, string>;
      set({
        scanStartDate: settings.scan_start_date || '',
        scanFrequencyMinutes: parseInt(settings.scan_frequency_minutes || '30', 10),
        theme: (settings.theme as 'light' | 'dark') || 'light',
        lastScanAt: settings.last_scan_at || null,
      });
    } catch {
      // Use defaults
    }
  },

  updateSettings: async (settings: Record<string, string>) => {
    await window.api.settings.set(settings);
    // Re-load
    const all = await window.api.settings.get() as Record<string, string>;
    set({
      scanStartDate: all.scan_start_date || '',
      scanFrequencyMinutes: parseInt(all.scan_frequency_minutes || '30', 10),
      theme: (all.theme as 'light' | 'dark') || 'light',
      lastScanAt: all.last_scan_at || null,
    });
  },
}));

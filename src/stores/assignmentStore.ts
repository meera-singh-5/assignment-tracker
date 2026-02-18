import { create } from 'zustand';
import type { Assignment } from '../types/assignment';

interface AssignmentState {
  assignments: Assignment[];
  loading: boolean;
  scanning: boolean;
  lastScan: string | null;
  fetchAssignments: () => Promise<void>;
  scanEmails: (startDate?: string) => Promise<void>;
  refreshEmails: () => Promise<void>;
  scanTasks: () => Promise<void>;
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;
  createAssignment: (data: Partial<Assignment>) => Promise<void>;
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  loading: false,
  scanning: false,
  lastScan: null,

  fetchAssignments: async () => {
    set({ loading: true });
    try {
      const assignments = await window.api.db.getAssignments() as Assignment[];
      set({ assignments, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  scanEmails: async (startDate?: string) => {
    set({ scanning: true });
    try {
      await window.api.gmail.scan(startDate);
      // Refresh the full list after scan
      const assignments = await window.api.db.getAssignments() as Assignment[];
      set({ assignments, scanning: false, lastScan: new Date().toISOString() });
    } catch {
      set({ scanning: false });
    }
  },

  refreshEmails: async () => {
    set({ scanning: true });
    try {
      await window.api.gmail.refresh();
      const assignments = await window.api.db.getAssignments() as Assignment[];
      set({ assignments, scanning: false, lastScan: new Date().toISOString() });
    } catch {
      set({ scanning: false });
    }
  },

  scanTasks: async () => {
    set({ scanning: true });
    try {
      await window.api.tasks.scan();
      const assignments = await window.api.db.getAssignments() as Assignment[];
      set({ assignments, scanning: false, lastScan: new Date().toISOString() });
    } catch {
      set({ scanning: false });
    }
  },

  updateAssignment: async (id: string, updates: Partial<Assignment>) => {
    try {
      await window.api.db.updateAssignment(id, updates);
      const assignments = get().assignments.map(a =>
        a.id === id ? { ...a, ...updates } : a
      );
      set({ assignments });
    } catch (err) {
      console.error('Failed to update assignment:', err);
    }
  },

  createAssignment: async (data: Partial<Assignment>) => {
    try {
      const created = await window.api.db.upsertAssignment({
        ...data,
        manually_created: true,
        status: 'pending',
      }) as Assignment;
      set({ assignments: [...get().assignments, created] });
    } catch (err) {
      console.error('Failed to create assignment:', err);
    }
  },
}));

import type { GradescopeSession } from './client';

// Single active Gradescope session, held in memory only — not persisted to
// disk, so it resets on app restart.
let current: { session: GradescopeSession; email: string } | null = null;

export function setCurrentSession(session: GradescopeSession, email: string): void {
  current = { session, email };
}

export function getCurrentSession(): { session: GradescopeSession; email: string } | null {
  return current;
}

export function clearCurrentSession(): void {
  current = null;
}

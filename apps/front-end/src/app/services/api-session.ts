import type { ApiSession } from '../models/api-session';

const storageKey = 'trip-planner-session';

export function readSession(): ApiSession | null {
  const value = localStorage.getItem(storageKey);
  if (!value) return null;
  try {
    return JSON.parse(value) as ApiSession;
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
}

export function writeSession(session: ApiSession | null): void {
  if (session) localStorage.setItem(storageKey, JSON.stringify(session));
  else localStorage.removeItem(storageKey);
}

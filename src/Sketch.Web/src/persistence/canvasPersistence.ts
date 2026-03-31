import type { Blueprint } from '../types/blueprint';

const STORAGE_KEY = 'sketch-blueprint-v1';
const DEBOUNCE_MS = 2000;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSave(blueprint: Blueprint): void {
  if (debounceTimer !== null) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprint));
    } catch {
      // localStorage quota exceeded — silently drop
    }
    debounceTimer = null;
  }, DEBOUNCE_MS);
}

export function loadSaved(): Blueprint | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Blueprint) : null;
  } catch {
    return null;
  }
}

export function clearSaved(): void {
  localStorage.removeItem(STORAGE_KEY);
}

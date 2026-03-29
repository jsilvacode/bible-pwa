import 'fake-indexeddb/auto';
import { afterEach, vi } from 'vitest';

function createStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(String(key), String(value));
    },
    removeItem: (key) => {
      map.delete(String(key));
    },
    clear: () => {
      map.clear();
    },
  };
}

if (!globalThis.localStorage || typeof globalThis.localStorage.clear !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createStorage(),
    configurable: true,
  });
}

if (!globalThis.sessionStorage || typeof globalThis.sessionStorage.clear !== 'function') {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: createStorage(),
    configurable: true,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

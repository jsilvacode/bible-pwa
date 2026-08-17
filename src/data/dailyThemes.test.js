import { describe, expect, it } from 'vitest';
import { DAILY_THEME_VERSES, getDailyTheme } from './dailyThemes';

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe('getDailyTheme', () => {
  it('mantiene el mismo versículo durante un día', () => {
    const storage = createStorage();
    const date = new Date('2026-08-17T12:00:00');

    expect(getDailyTheme({ date, storage })).toEqual(getDailyTheme({ date, storage }));
  });

  it('recorre la guía completa sin repetir antes de reiniciar', () => {
    const storage = createStorage();
    const selection = Array.from({ length: DAILY_THEME_VERSES.length }, (_, index) => {
      const date = new Date('2026-01-01T12:00:00');
      date.setDate(date.getDate() + index);
      return getDailyTheme({ date, storage }).id;
    });

    expect(new Set(selection).size).toBe(DAILY_THEME_VERSES.length);
  });
});

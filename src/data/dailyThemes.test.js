import { describe, expect, it } from 'vitest';
import { DAILY_THEME_VERSES, getDailyTheme } from './dailyThemes';

describe('Pan de vida', () => {
  it('contiene una guía editorial de 90 cápsulas distintas', () => {
    expect(DAILY_THEME_VERSES).toHaveLength(90);
    expect(new Set(DAILY_THEME_VERSES.map((theme) => theme.id)).size).toBe(90);
    expect(DAILY_THEME_VERSES.every((theme) => theme.message && theme.book && theme.chapter && theme.verse)).toBe(true);
  });

  it('recorre los 90 días sin repetir y vuelve a comenzar', () => {
    const firstDay = new Date('2026-01-01T12:00:00');
    const selection = Array.from({ length: 90 }, (_, index) => {
      const date = new Date(firstDay);
      date.setDate(date.getDate() + index);
      return getDailyTheme({ date }).id;
    });
    const nextCycle = new Date(firstDay);
    nextCycle.setDate(nextCycle.getDate() + 90);

    expect(new Set(selection).size).toBe(90);
    expect(getDailyTheme({ date: nextCycle }).id).toBe(selection[0]);
  });
});

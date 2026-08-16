import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsProvider, useRecentReads, useSettings } from './useSettings';

const RECENT_KEY = 'bible_recent';
const LOG_KEY = 'bible_reading_log';

function localDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function shiftDate(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

describe('useRecentReads', () => {
  const wrapper = ({ children }) => <SettingsProvider>{children}</SettingsProvider>;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deduplicates entries and moves the latest open to the top', () => {
    const { result } = renderHook(() => useRecentReads(), { wrapper });

    act(() => {
      result.current.addRecent(1, 1);
      result.current.addRecent(2, 1);
      result.current.addRecent(1, 1);
    });

    expect(result.current.recent).toHaveLength(2);
    expect(result.current.recent[0].book).toBe(1);
    expect(result.current.recent[0].chapter).toBe(1);
  });

  it('keeps the latest entry plus up to 5 previous entries', () => {
    const { result } = renderHook(() => useRecentReads(), { wrapper });

    act(() => {
      for (let i = 1; i <= 12; i += 1) {
        result.current.addRecent(i, 1);
      }
    });

    expect(result.current.recent).toHaveLength(6);
    expect(result.current.recent[0].book).toBe(12);
    expect(result.current.recent[5].book).toBe(7);

    const persisted = JSON.parse(localStorage.getItem(RECENT_KEY));
    expect(persisted).toHaveLength(6);
  });

  it('counts one day once while keeping unique chapters as secondary activity', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    act(() => {
      result.current.addRecent(1, 1);
      result.current.addRecent(1, 1);
      result.current.addRecent(1, 2);
    });

    expect(result.current.log).toHaveLength(1);
    expect(result.current.log[0].count).toBe(2);
    expect(result.current.currentStreak).toBe(1);
    expect(result.current.hasReadToday).toBe(true);
  });

  it('calculates the current and best streak from consecutive local days', () => {
    vi.useFakeTimers();
    const today = new Date(2026, 7, 2, 12);
    vi.setSystemTime(today);
    localStorage.setItem(LOG_KEY, JSON.stringify([
      { date: localDateKey(today), count: 1 },
      { date: localDateKey(shiftDate(today, -1)), count: 1 },
      { date: localDateKey(shiftDate(today, -2)), count: 1 },
      { date: localDateKey(shiftDate(today, -4)), count: 1 },
    ]));

    const { result } = renderHook(() => useSettings(), { wrapper });

    expect(result.current.currentStreak).toBe(3);
    expect(result.current.bestStreak).toBe(3);
    expect(result.current.daysReadThisWeek).toBe(4);
  });
});

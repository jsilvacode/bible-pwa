import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { SettingsProvider, useSettings } from './useSettings';

const SETTINGS_KEY = 'bible_settings';

describe('useSettings version migration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('migrates rvr60 from localStorage to rva2015 on init', async () => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ version: 'rvr60', theme: 'light', fontSize: 'md' })
    );

    const { result } = renderHook(() => useSettings(), {
      wrapper: ({ children }) => <SettingsProvider>{children}</SettingsProvider>,
    });

    await waitFor(() => {
      expect(result.current.settings.version).toBe('rva2015');
    });

    const persisted = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    expect(persisted.version).toBe('rva2015');
  });
});

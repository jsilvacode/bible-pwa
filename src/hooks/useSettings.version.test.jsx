import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { SettingsProvider, useSettings } from './useSettings';

const SETTINGS_KEY = 'bible_settings';

describe('useSettings version migration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('usa NBLA como versión inicial', async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: ({ children }) => <SettingsProvider>{children}</SettingsProvider>,
    });

    await waitFor(() => {
      expect(result.current.settings.version).toBe('nbla');
    });
  });

  it('migra versiones predeterminadas anteriores a NBLA', async () => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ version: 'rvr60', theme: 'light', fontSize: 'md' })
    );

    const { result } = renderHook(() => useSettings(), {
      wrapper: ({ children }) => <SettingsProvider>{children}</SettingsProvider>,
    });

    await waitFor(() => {
      expect(result.current.settings.version).toBe('nbla');
    });

    const persisted = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    expect(persisted.version).toBe('nbla');
    expect(persisted.versionDefaultRevision).toBe(2);
  });

  it('migra el antiguo valor predeterminado RVA2015 a NBLA', async () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ version: 'rva2015' }));

    const { result } = renderHook(() => useSettings(), {
      wrapper: ({ children }) => <SettingsProvider>{children}</SettingsProvider>,
    });

    await waitFor(() => {
      expect(result.current.settings.version).toBe('nbla');
    });
  });

  it('respeta RVA2015 cuando fue elegida después de la migración', async () => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ version: 'rva2015', versionDefaultRevision: 2 })
    );

    const { result } = renderHook(() => useSettings(), {
      wrapper: ({ children }) => <SettingsProvider>{children}</SettingsProvider>,
    });

    await waitFor(() => {
      expect(result.current.settings.version).toBe('rva2015');
    });
  });
});

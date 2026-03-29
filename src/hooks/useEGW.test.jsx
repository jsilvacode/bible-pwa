import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEGW } from './useEGW';

const STORAGE_TOKEN_KEY = 'egw_access_token';

describe('useEGW', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('stores token with expiration metadata after successful code exchange', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'token-123', expires_in: 3600 }),
    }));

    const { result } = renderHook(() => useEGW());

    await act(async () => {
      const ok = await result.current.exchangeCode('valid-code');
      expect(ok).toBe(true);
    });

    expect(result.current.token).toBe('token-123');
    const stored = JSON.parse(localStorage.getItem(STORAGE_TOKEN_KEY));
    expect(stored.accessToken).toBe('token-123');
    expect(stored.expiresAt).toBeGreaterThan(Date.now());
  });

  it('clears invalid legacy token when exchange fails', async () => {
    localStorage.setItem(STORAGE_TOKEN_KEY, 'legacy-token');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const { result } = renderHook(() => useEGW());
    expect(result.current.token).toBe('legacy-token');

    await act(async () => {
      const ok = await result.current.exchangeCode('invalid-code');
      expect(ok).toBe(false);
    });

    expect(result.current.token).toBeNull();
    expect(localStorage.getItem(STORAGE_TOKEN_KEY)).toBeNull();
  });

  it('drops expired structured token on initialization', () => {
    localStorage.setItem(STORAGE_TOKEN_KEY, JSON.stringify({
      accessToken: 'expired-token',
      expiresAt: Date.now() - 1_000,
    }));

    const { result } = renderHook(() => useEGW());

    expect(result.current.token).toBeNull();
    expect(localStorage.getItem(STORAGE_TOKEN_KEY)).toBeNull();
  });
});

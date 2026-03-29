import { useState, useCallback } from 'react';
import { get, set } from 'idb-keyval';
import { egwCacheStore } from '../services/db';

const STORAGE_TOKEN_KEY = 'egw_access_token';
const OAUTH_STATE_KEY = 'egw_oauth_state';
const FALLBACK_TOKEN_TTL_SECONDS = 60 * 60;

function readStoredToken() {
  const raw = localStorage.getItem(STORAGE_TOKEN_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.accessToken) {
      if (parsed.expiresAt && parsed.expiresAt <= Date.now()) {
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        return null;
      }
      return parsed.accessToken;
    }
  } catch {
    // Backward compatibility: token previously stored as plain string.
    return raw;
  }

  return null;
}

function clearStoredToken() {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
}

function persistToken(accessToken, expiresIn) {
  const ttlSeconds = Number(expiresIn) > 0 ? Number(expiresIn) : FALLBACK_TOKEN_TTL_SECONDS;
  localStorage.setItem(STORAGE_TOKEN_KEY, JSON.stringify({
    accessToken,
    expiresAt: Date.now() + ttlSeconds * 1000
  }));
}

function createOAuthState() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, n => n.toString(16).padStart(2, '0')).join('');
}

export function useEGW() {
  const [token, setToken] = useState(readStoredToken);

  const validateOAuthState = useCallback((incomingState) => {
    const savedState = sessionStorage.getItem(OAUTH_STATE_KEY);
    sessionStorage.removeItem(OAUTH_STATE_KEY);
    return Boolean(savedState && incomingState && savedState === incomingState);
  }, []);

  const login = async () => {
    try {
      const res = await fetch('/.netlify/functions/egw-config');
      if (!res.ok) {
        throw new Error(`egw-config HTTP ${res.status}`);
      }

      const { clientId, redirectUri } = await res.json();
      if (!clientId || !redirectUri) {
        throw new Error('Missing EGW OAuth config');
      }

      const state = createOAuthState();
      sessionStorage.setItem(OAUTH_STATE_KEY, state);

      const authUrl = `https://cpanel.egwwritings.org/connect/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;

      window.location.href = authUrl;
    } catch (e) {
      console.error('Error al obtener la configuración de EGW:', e);
      alert('Error de conexión con EGW Writings.');
    }
  };

  const exchangeCode = async (code) => {
    try {
      const res = await fetch('/.netlify/functions/egw-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `egw-token HTTP ${res.status}`);
      }

      if (!data.access_token) {
        throw new Error('Missing access token in response');
      }

      persistToken(data.access_token, data.expires_in);
      setToken(data.access_token);
      return true;
    } catch (e) {
      console.error('Error al canjear código OAuth:', e);
      clearStoredToken();
      setToken(null);
      return false;
    }
  };

  const fetchWithCache = useCallback(async (endpoint, ignoreCache = false) => {
    const cacheKey = `egw:${endpoint}`;
    
    if (!ignoreCache) {
      const cached = await get(cacheKey, egwCacheStore);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
      }
    }

    if (!token) throw new Error('NO_TOKEN');

    const res = await fetch('/.netlify/functions/egw-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint,
        token,
      })
    });

    if (res.status === 401) {
      clearStoredToken();
      setToken(null);
      throw new Error('NO_TOKEN');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || `EGW_SEARCH_${res.status}`);
    }
    
    // Save to cache (TTL = 7 días)
    await set(cacheKey, { data, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 }, egwCacheStore);
    
    return data;
  }, [token]);

  return { token, login, exchangeCode, fetchWithCache, validateOAuthState };
}

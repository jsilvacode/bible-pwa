import { useState, useCallback } from 'react';
import { get, set } from 'idb-keyval';
import { egwCacheStore } from '../services/db';

const STORAGE_TOKEN_KEY = 'egw_access_token';
const API_BASE = 'https://a.egwwritings.org';

export function useEGW() {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_TOKEN_KEY));

  const authUrl = `https://cpanel.egwwritings.org/connect/authorize?client_id=${import.meta.env.VITE_EGW_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(import.meta.env.VITE_EGW_REDIRECT_URI)}`;

  const login = () => {
    window.location.href = authUrl;
  };

  const exchangeCode = async (code) => {
    // Si estamos en dev (localhost) la netlify function local puede simularse o requerir `netlify dev`
    // Como esto puede fallar si no corre `netlify dev`, haremos un fetch al endpoint '/.netlify/functions/egw-token'
    const res = await fetch('/.netlify/functions/egw-token', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem(STORAGE_TOKEN_KEY, data.access_token);
      setToken(data.access_token);
      return true;
    }
    return false;
  };

  const fetchWithCache = useCallback(async (endpoint, ignoreCache = false) => {
    const url = `${API_BASE}${endpoint}`;
    
    if (!ignoreCache) {
      const cached = await get(url, egwCacheStore);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
      }
    }

    if (!token) throw new Error('NO_TOKEN');

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 401) {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      setToken(null);
      throw new Error('NO_TOKEN');
    }

    const data = await res.json();
    
    // Save to cache (TTL = 7 días)
    await set(url, { data, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 }, egwCacheStore);
    
    return data;
  }, [token]);

  return { token, login, exchangeCode, fetchWithCache };
}

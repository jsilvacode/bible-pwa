import { createContext, createElement, useCallback, useContext, useMemo, useState } from 'react';

const GlobalSearchContext = createContext(null);

export function GlobalSearchProvider({ children }) {
  const [searchRequest, setSearchRequest] = useState({
    isOpen: false,
    initialQuery: '',
    requestId: 0,
  });

  const openSearch = useCallback((initialQuery = '') => {
    setSearchRequest((current) => ({
      isOpen: true,
      initialQuery,
      requestId: current.requestId + 1,
    }));
  }, []);

  const closeSearch = useCallback(() => {
    setSearchRequest((current) => ({ ...current, isOpen: false }));
  }, []);

  const value = useMemo(
    () => ({ ...searchRequest, openSearch, closeSearch }),
    [searchRequest, openSearch, closeSearch]
  );

  return createElement(GlobalSearchContext.Provider, { value }, children);
}

export function useGlobalSearch() {
  const context = useContext(GlobalSearchContext);
  if (!context) {
    throw new Error('useGlobalSearch must be used within a GlobalSearchProvider');
  }
  return context;
}

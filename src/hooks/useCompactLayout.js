import { useEffect, useState } from 'react';

const COMPACT_LAYOUT_QUERY = '(max-width: 599px)';

function getCompactLayout() {
  return typeof window !== 'undefined' && window.matchMedia(COMPACT_LAYOUT_QUERY).matches;
}

export function useCompactLayout() {
  const [isCompactLayout, setIsCompactLayout] = useState(getCompactLayout);

  useEffect(() => {
    const mediaQuery = window.matchMedia(COMPACT_LAYOUT_QUERY);
    const updateLayout = () => setIsCompactLayout(mediaQuery.matches);

    updateLayout();
    mediaQuery.addEventListener('change', updateLayout);
    return () => mediaQuery.removeEventListener('change', updateLayout);
  }, []);

  return isCompactLayout;
}

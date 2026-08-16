import React, { lazy, Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import SiteFooter from './SiteFooter';
import { useReadingMode } from '../../hooks/useReadingMode';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import classes from './AppShell.module.css';

const SearchModal = lazy(() => import('../home/SearchModal'));

export default function AppShell() {
  const location = useLocation();
  const { chromeHidden, readerControlsIdle, readerAtEnd, isReaderActive } = useReadingMode();
  const { showInstallPopup, isInstalled, promptInstall, dismissInstallPopup } = useInstallPrompt();
  const { isOpen, initialQuery, requestId, closeSearch } = useGlobalSearch();
  const hideChrome = isReaderActive && chromeHidden;
  const showFooter = location.pathname === '/' || location.pathname === '/settings';

  useEffect(() => {
    if (location.pathname !== '/' || location.hash !== '#donar') return undefined;

    const frameId = window.requestAnimationFrame(() => {
      const donationSection = document.getElementById('donar');
      if (!donationSection) return;

      window.scrollTo({
        top: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
        behavior: 'smooth',
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [location.hash, location.pathname]);

  return (
    <div className={classes.appShell}>
      <TopBar hidden={hideChrome} />
      <main className={`${classes.mainContent} ${isReaderActive ? classes.readerActive : ''}`}>
        <Suspense fallback={<div className={classes.routeFallback} role="status">Cargando…</div>}>
          <Outlet />
        </Suspense>
        {showFooter && <SiteFooter />}
      </main>
      <BottomNav hidden={readerControlsIdle && !readerAtEnd} />
      {isOpen && (
        <Suspense fallback={null}>
          <SearchModal
            isOpen
            initialQuery={initialQuery}
            requestId={requestId}
            onClose={closeSearch}
          />
        </Suspense>
      )}

      {showInstallPopup && !isInstalled && !hideChrome && (
        <div className={classes.installOverlay}>
          <div className={classes.installPopup}>
            <h4>Instala Santa Biblia</h4>
            <p>Accede rápido desde tu pantalla de inicio.</p>
            <div className={classes.installPopupActions}>
              <button type="button" onClick={promptInstall}>Instalar ahora</button>
              <button type="button" onClick={dismissInstallPopup}>Ahora no</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

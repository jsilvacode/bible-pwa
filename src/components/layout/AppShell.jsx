import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { useReadingMode } from '../../hooks/useReadingMode';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import classes from './AppShell.module.css';

export default function AppShell() {
  const location = useLocation();
  const { chromeHidden, isReaderActive } = useReadingMode();
  const { showInstallPopup, isInstalled, promptInstall, dismissInstallPopup } = useInstallPrompt();
  const hideChrome = isReaderActive && chromeHidden;

  return (
    <div className={classes.appShell}>
      <TopBar hidden={hideChrome} />
      <main className={`${classes.mainContent} ${isReaderActive ? classes.readerActive : ''}`}>
        <Outlet key={location.pathname} />
      </main>
      <BottomNav hidden={hideChrome} />

      {showInstallPopup && !isInstalled && !hideChrome && (
        <div className={classes.installOverlay}>
          <div className={classes.installPopup}>
            <h4>Instala La Biblia</h4>
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

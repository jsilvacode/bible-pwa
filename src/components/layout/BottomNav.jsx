import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import classes from './BottomNav.module.css';

export default function BottomNav() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() =>
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  );

  useEffect(() => {
    const standaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    const handleBeforeInstallPrompt = (event) => {
      if (standaloneMode) return;
      event.preventDefault();
      setInstallPrompt(event);
      window.__bibleInstallPrompt = event;
      setShowInstallPopup(true);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      window.__bibleInstallPrompt = null;
      setIsInstalled(true);
      setShowInstallPopup(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (isInstalled) return;

    if (!installPrompt) {
      setShowInstallPopup(false);
      return;
    }

    const deferred = installPrompt || window.__bibleInstallPrompt;
    if (!deferred) {
      setShowInstallPopup(false);
      return;
    }

    deferred.prompt();
    await deferred.userChoice;
    setInstallPrompt(null);
    window.__bibleInstallPrompt = null;
    setShowInstallPopup(false);
  };

  return (
    <>
      {showInstallPopup && !isInstalled && (
        <div className={classes.installOverlay}>
          <div className={classes.installPopup}>
            <h4>Instala Santa Biblia RVR60</h4>
            <p>Accede rápido desde tu pantalla de inicio.</p>
            <div className={classes.installPopupActions}>
              <button type="button" onClick={handleInstall}>Instalar ahora</button>
              <button type="button" onClick={() => setShowInstallPopup(false)}>Ahora no</button>
            </div>
          </div>
        </div>
      )}
      <nav className={classes.bottomNav}>
        <NavLink className={({isActive}) => isActive ? classes.active : ''} to="/">
          <svg className={classes.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span className={classes.label}>Inicio</span>
        </NavLink>
        <NavLink className={({isActive}) => isActive ? classes.active : ''} to="/bible">
          <svg className={classes.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          <span className={classes.label}>Biblia</span>
        </NavLink>
        <NavLink className={({isActive}) => isActive ? classes.active : ''} to="/bookmarks">
          <svg className={classes.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
          <span className={classes.label}>Favoritos</span>
        </NavLink>
        <NavLink className={({isActive}) => isActive ? classes.active : ''} to="/settings">
          <svg className={classes.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span className={classes.label}>Ajustes</span>
        </NavLink>
      </nav>
    </>
  );
}

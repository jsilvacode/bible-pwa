import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import classes from './BottomNav.module.css';

export default function BottomNav() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installHint, setInstallHint] = useState('');
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
      setInstallHint('');
      setShowInstallPopup(true);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      window.__bibleInstallPrompt = null;
      setIsInstalled(true);
      setInstallHint('Aplicación instalada');
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
    if (isInstalled) {
      setInstallHint('La aplicación ya está instalada');
      return;
    }

    if (!installPrompt) {
      setInstallHint('Usa el menú del navegador para instalar');
      return;
    }

    const deferred = installPrompt || window.__bibleInstallPrompt;
    if (!deferred) {
      setInstallHint('Usa el menú del navegador para instalar');
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
        <NavLink className={({isActive}) => isActive ? classes.active : ''} to="/">Inicio</NavLink>
        <NavLink className={({isActive}) => isActive ? classes.active : ''} to="/bookmarks">Marcadores</NavLink>
        <NavLink className={({isActive}) => isActive ? classes.active : ''} to="/settings">Ajustes</NavLink>
        <button
          className={classes.installBtn}
          onClick={handleInstall}
          type="button"
          disabled={isInstalled}
        >
          {isInstalled ? 'Instalada' : 'Instalar'}
        </button>
        {installHint && <span className={classes.installHint}>{installHint}</span>}
      </nav>
    </>
  );
}

import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import classes from './BottomNav.module.css';

export default function BottomNav() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installHint, setInstallHint] = useState('');

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setInstallHint('');
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setInstallHint('Aplicación instalada');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      setInstallHint('Usa el menú del navegador para instalar');
      return;
    }

    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <nav className={classes.bottomNav}>
      <NavLink className={({isActive}) => isActive ? classes.active : ''} to="/">Inicio</NavLink>
      <NavLink className={({isActive}) => isActive ? classes.active : ''} to="/search">Buscar</NavLink>
      <NavLink className={({isActive}) => isActive ? classes.active : ''} to="/bookmarks">Marcadores</NavLink>
      <NavLink className={({isActive}) => isActive ? classes.active : ''} to="/settings">Ajustes</NavLink>
      <button className={classes.installBtn} onClick={handleInstall} type="button">Instalar</button>
      {installHint && <span className={classes.installHint}>{installHint}</span>}
    </nav>
  );
}

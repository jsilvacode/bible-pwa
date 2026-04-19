import React, { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import classes from './SettingsView.module.css';

export default function SettingsView() {
  const { settings, updateSettings } = useSettings();
  const [installMessage, setInstallMessage] = useState('');
  const mercadoPagoUrl = 'https://link.mercadopago.cl/jsilvacoder';
  const paypalUrl = 'https://paypal.me/jsilvacode';
  const isInstalled =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    
  const themeTabs = [
    { id: 'light', label: 'Modo Claro', theme: 'light', color: '#FAF9F6', textColor: '#2B1B1B' },
    { id: 'dark', label: 'Modo Oscuro', theme: 'dark', color: '#2B1B1B', textColor: '#F5EDED' },
  ];

  const handleInstall = async () => {
    if (isInstalled) {
      setInstallMessage('La aplicación ya está instalada.');
      return;
    }
    const deferred = window.__bibleInstallPrompt;
    if (!deferred) {
      setInstallMessage('Usa el menú del navegador para instalar.');
      return;
    }
    try {
      deferred.prompt();
      await deferred.userChoice;
      window.__bibleInstallPrompt = null;
      setInstallMessage('Solicitud enviada.');
    } catch (e) {
      setInstallMessage('Error al iniciar instalación.');
    }
  };

  return (
    <div className={classes.container}>
      <header className={classes.header}>
        <h2 className={classes.title}>Ajustes</h2>
        <p className={classes.subtitle}>Personaliza tu experiencia de lectura</p>
      </header>
      
      <section className={classes.section}>
        <h3 className={classes.sectionLabel}>Apariencia</h3>
        <div className={classes.card}>
          <div className={classes.group}>
            <label>Tema visual</label>
            <div className={classes.themeGrid}>
              {themeTabs.map(tab => (
                <button 
                  key={tab.id}
                  className={`${classes.themeOption} ${settings.theme === tab.theme ? classes.active : ''}`}
                  onClick={() => updateSettings({ theme: tab.theme, tone: tab.id })}
                >
                  <div className={classes.themePreview} style={{ background: tab.color }} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={classes.group}>
            <label>Tamaño de lectura</label>
            <div className={classes.fontGrid}>
              {['sm', 'md', 'lg', 'xl'].map(size => (
                <button
                  key={size}
                  className={`${classes.fontOption} ${settings.fontSize === size ? classes.active : ''}`}
                  onClick={() => updateSettings({ fontSize: size })}
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={classes.section}>
        <h3 className={classes.sectionLabel}>Aplicación</h3>
        <div className={classes.card}>
          <div className={classes.group}>
            <label>Acceso rápido</label>
            <button
              type="button"
              className={classes.installBtn}
              onClick={handleInstall}
              disabled={isInstalled}
            >
              {isInstalled ? '✓ Aplicación Instalada' : 'Instalar en este dispositivo'}
            </button>
            {installMessage && <p className={classes.status}>{installMessage}</p>}
          </div>
        </div>
      </section>

      <section className={classes.section}>
        <h3 className={classes.sectionLabel}>Apoya el proyecto</h3>
        <div className={classes.donationCard}>
          <p>Este proyecto es gratuito y sin anuncios. Tu donación ayuda a mantener los servidores y el desarrollo.</p>
          <div className={classes.donationActions}>
            <a href={mercadoPagoUrl} target="_blank" rel="noopener" className={classes.mpBtn}>Mercado Pago</a>
            <a href={paypalUrl} target="_blank" rel="noopener" className={classes.ppBtn}>PayPal</a>
          </div>
        </div>
      </section>
      
      <footer className={classes.footer}>
        <p>Santa Biblia RVR60 v2.0</p>
        <p>Desarrollado con ❤️ por Julio Silva</p>
      </footer>
    </div>
  );
}

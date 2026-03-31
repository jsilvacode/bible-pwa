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

  const handleInstall = async () => {
    if (isInstalled) {
      setInstallMessage('La aplicación ya está instalada.');
      return;
    }

    const deferred = window.__bibleInstallPrompt;
    if (!deferred) {
      setInstallMessage('Tu navegador no mostró el aviso automático. Usa el menú del navegador para instalar.');
      return;
    }

    try {
      deferred.prompt();
      await deferred.userChoice;
      window.__bibleInstallPrompt = null;
      setInstallMessage('Solicitud de instalación enviada.');
    } catch (e) {
      console.error('Error al instalar desde ajustes', e);
      setInstallMessage('No fue posible iniciar la instalación en este momento.');
    }
  };

  return (
    <div className={classes.container}>
      <h2 className={classes.title}>Ajustes</h2>
      
      <div className={classes.card}>
        <div className={classes.group}>
          <label>Tema de la Aplicación</label>
          <select value={settings.theme} onChange={e => updateSettings({ theme: e.target.value })}>
            <option value="light">☀️ Claro</option>
            <option value="dark">🌙 Oscuro</option>
            <option value="sepia">📜 Sepia</option>
          </select>
        </div>

        <div className={classes.group}>
          <label>Tamaño de Fuente (Solo Lectura)</label>
          <select value={settings.fontSize} onChange={e => updateSettings({ fontSize: e.target.value })}>
            <option value="sm">Pequeña</option>
            <option value="md">Mediana</option>
            <option value="lg">Grande</option>
            <option value="xl">Extra Grande</option>
          </select>
        </div>

        <div className={classes.group}>
          <label>Instalación</label>
          <button
            type="button"
            className={classes.installAction}
            onClick={handleInstall}
            disabled={isInstalled}
          >
            {isInstalled ? 'Aplicación instalada' : 'Instalar app'}
          </button>
          {installMessage && <p className={classes.installMessage}>{installMessage}</p>}
        </div>
      </div>
      
      <div className={classes.info}>
        <p>Santa Biblia RVR60 v1.x</p>
        <p>Copyright - Desarrollado por Julio Silva.</p>
      </div>

      <div className={classes.donationBox}>
        <p className={classes.donationText}>
          Si quieres apoyar este proyecto, su mantención y desarrollo de mejoras puedes hacer una donación en el siguiente enlace.
        </p>
        <div className={classes.donationActions}>
          <a
            className={classes.donationBtn}
            href={mercadoPagoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Donar con Mercado Pago
          </a>
          <a
            className={classes.donationBtn}
            href={paypalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Donar con PayPal
          </a>
        </div>
      </div>
    </div>
  );
}

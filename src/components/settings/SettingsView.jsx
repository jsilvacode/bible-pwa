import React, { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import classes from './SettingsView.module.css';

export default function SettingsView() {
  const { settings, updateSettings } = useSettings();
  const { isInstalled, promptInstall } = useInstallPrompt();
  const [installMessage, setInstallMessage] = useState('');

  const themeTabs = [
    { id: 'light', label: 'Modo Claro', theme: 'light', previewClass: classes.themePreviewLight },
    { id: 'dark', label: 'Modo Oscuro', theme: 'dark', previewClass: classes.themePreviewDark },
  ];

  const handleInstall = async () => {
    const result = await promptInstall();
    setInstallMessage(result.message);
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
              {themeTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`${classes.themeOption} ${settings.theme === tab.theme ? classes.active : ''}`}
                  onClick={() => updateSettings({ theme: tab.theme })}
                >
                  <div className={`${classes.themePreview} ${tab.previewClass}`} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={classes.group}>
            <label>Tamaño de lectura</label>
            <div className={classes.fontGrid}>
              {['sm', 'md', 'lg', 'xl'].map((size) => (
                <button
                  key={size}
                  type="button"
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
    </div>
  );
}

import React from 'react';
import { useSettings } from '../../hooks/useSettings';
import classes from './SettingsView.module.css';

export default function SettingsView() {
  const { settings, updateSettings } = useSettings();

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
          <label>Tamaño de Fuente (App + Lectura)</label>
          <select value={settings.fontSize} onChange={e => updateSettings({ fontSize: e.target.value })}>
            <option value="sm">Pequeña</option>
            <option value="md">Mediana</option>
            <option value="lg">Grande</option>
            <option value="xl">Extra Grande</option>
          </select>
        </div>
      </div>
      
      <div className={classes.info}>
        <p>Santa Biblia PWA v1.0</p>
        <p>Guardado Local Activo</p>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import classes from './ReaderFAB.module.css';
import { useSettings } from '../../hooks/useSettings';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import { IconSearch } from '../ui/Icons';

export default function ReaderFAB({ hidden = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSettings } = useSettings();
  const { openSearch } = useGlobalSearch();

  const handleFontSize = (delta) => {
    const sizes = ['sm', 'md', 'lg', 'xl'];
    const currentIdx = sizes.indexOf(settings.fontSize);
    let nextIdx = currentIdx + delta;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= sizes.length) nextIdx = sizes.length - 1;
    updateSettings({ fontSize: sizes[nextIdx] });
  };

  return (
    <div
      className={`${classes.wrapper} ${hidden ? classes.hidden : ''}`}
      aria-hidden={hidden || undefined}
    >
      {isOpen && (
        <div className={classes.panel}>
          <div className={classes.section}>
            <span className={classes.label}>Tamaño de fuente</span>
            <div className={classes.controls}>
              <button onClick={() => handleFontSize(-1)} disabled={settings.fontSize === 'sm'}>A-</button>
              <span className={classes.currentSize}>{settings.fontSize.toUpperCase()}</span>
              <button onClick={() => handleFontSize(1)} disabled={settings.fontSize === 'xl'}>A+</button>
            </div>
          </div>
          
          <div className={classes.section}>
            <span className={classes.label}>Tema</span>
            <div className={classes.themes}>
              <button 
                className={`${classes.themeBtn} ${classes.lightThemeBtn} ${settings.theme === 'light' ? classes.active : ''}`}
                onClick={() => updateSettings({ theme: 'light' })}
                title="Modo Claro"
                aria-label="Claro"
              />
              <button 
                className={`${classes.themeBtn} ${classes.darkThemeBtn} ${settings.theme === 'dark' ? classes.active : ''}`}
                onClick={() => updateSettings({ theme: 'dark' })}
                title="Modo Oscuro"
                aria-label="Oscuro"
              />
            </div>
          </div>
        </div>
      )}
      
      <div className={classes.dock} aria-label="Herramientas de lectura">
        <div className={classes.action}>
          <span className={classes.tooltip} role="tooltip">Buscar</span>
          <button
            type="button"
            className={`${classes.fab} ${classes.searchFab}`}
            onClick={() => {
              setIsOpen(false);
              openSearch();
            }}
            aria-label="Buscar"
          >
            <IconSearch size={22} />
          </button>
        </div>

        <div className={classes.action}>
          <span className={classes.tooltip} role="tooltip">Ajustes rápidos</span>
          <button
            type="button"
            className={`${classes.fab} ${classes.settingsFab} ${isOpen ? classes.fabOpen : ''}`}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Ajustes rápidos"
            aria-expanded={isOpen}
          >
            {isOpen ? '✕' : 'Aa'}
          </button>
        </div>
      </div>

      {isOpen && <div className={classes.overlay} onClick={() => setIsOpen(false)} aria-hidden="true" />}
    </div>
  );
}

import React, { useState } from 'react';
import classes from './ReaderFAB.module.css';
import { useSettings } from '../../hooks/useSettings';

export default function ReaderFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSettings } = useSettings();

  const handleFontSize = (delta) => {
    const sizes = ['sm', 'md', 'lg', 'xl'];
    const currentIdx = sizes.indexOf(settings.fontSize);
    let nextIdx = currentIdx + delta;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= sizes.length) nextIdx = sizes.length - 1;
    updateSettings({ fontSize: sizes[nextIdx] });
  };

  return (
    <div className={classes.wrapper}>
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
                className={`${classes.themeBtn} ${settings.theme === 'light' ? classes.active : ''}`}
                style={{ background: '#FAF9F6' }}
                onClick={() => updateSettings({ theme: 'light', tone: 'light' })}
                title="Modo Claro"
                aria-label="Claro"
              />
              <button 
                className={`${classes.themeBtn} ${settings.theme === 'dark' ? classes.active : ''}`}
                style={{ background: '#2B1B1B' }}
                onClick={() => updateSettings({ theme: 'dark', tone: 'dark' })}
                title="Modo Oscuro"
                aria-label="Oscuro"
              />
            </div>
          </div>
        </div>
      )}
      
      <button 
        className={`${classes.fab} ${isOpen ? classes.fabOpen : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Ajustes de lectura"
      >
        {isOpen ? '✕' : 'Aa'}
      </button>

      {isOpen && <div className={classes.overlay} onClick={() => setIsOpen(false)} />}
    </div>
  );
}

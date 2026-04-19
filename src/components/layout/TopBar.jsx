import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import VersionSelector from '../ui/VersionSelector';
import BookDrawer from './BookDrawer';
import classes from './TopBar.module.css';

export default function TopBar() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    window.__openBookDrawer = () => {
      setIsDrawerOpen(true);
    };
    return () => delete window.__openBookDrawer;
  }, []);

  return (
    <>
      <header className={`${classes.topBar} glass`}>
        {!isHome && (
          <button 
            className={classes.menuIcon} 
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Abrir índice de libros"
          >
            <span className={classes.menuIconGlyph}>☰</span>
            <span className={classes.menuLabelMobile}>Libros</span>
          </button>
        )}
        {isHome && (
          <div className={classes.logo}>
            <span className={classes.logoIcon}>📖</span>
            <span className={classes.logoText}>Santa Biblia</span>
          </div>
        )}
        <div className={classes.actions}>
          <VersionSelector />
        </div>
      </header>
      <BookDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}

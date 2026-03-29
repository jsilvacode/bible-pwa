import React, { useState } from 'react';
import VersionSelector from '../ui/VersionSelector';
import BookDrawer from './BookDrawer';
import classes from './TopBar.module.css';

export default function TopBar() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <header className={classes.topBar}>
        <button 
          className={classes.menuIcon} 
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Abrir índice de libros"
        >
          <span className={classes.menuIconGlyph}>☰</span>
          <span className={classes.menuLabelMobile}>Libros</span>
          <span className={classes.menuLabelDesktop}>Índice de Libros</span>
        </button>
        <h1 className={classes.title}>Santa Biblia</h1>
        <VersionSelector />
      </header>
      <BookDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}

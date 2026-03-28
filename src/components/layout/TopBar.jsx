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
        >
          ☰
        </button>
        <h1 className={classes.title}>Santa Biblia</h1>
        <VersionSelector />
      </header>
      <BookDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}

import React from 'react';
import VersionSelector from '../ui/VersionSelector';
import classes from './TopBar.module.css';

export default function TopBar() {
  return (
    <header className={`${classes.topBar} glass`}>
      <div className={classes.logo}>
        <span className={classes.logoIcon}>📖</span>
        <span className={classes.logoText}>Santa Biblia</span>
      </div>
      <div className={classes.actions}>
        <VersionSelector />
      </div>
    </header>
  );
}

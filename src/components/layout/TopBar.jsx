import React from 'react';
import { useNavigate } from 'react-router-dom';
import VersionSelector from '../ui/VersionSelector';
import { IconBook } from '../ui/Icons';
import classes from './TopBar.module.css';

export default function TopBar({ hidden = false }) {
  const navigate = useNavigate();

  return (
    <header className={`${classes.topBar} glass ${hidden ? classes.hidden : ''}`}>
      <button type="button" className={classes.logo} onClick={() => navigate('/')} aria-label="Ir al inicio">
        <IconBook size={22} className={classes.logoIconSvg} />
        <span className={classes.logoText}>La Biblia</span>
      </button>
      <div className={classes.actions}>
        <VersionSelector />
      </div>
    </header>
  );
}

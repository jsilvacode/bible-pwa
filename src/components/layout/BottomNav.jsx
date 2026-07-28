import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { IconHome, IconBook, IconBookmark, IconSettings } from '../ui/Icons';
import classes from './BottomNav.module.css';

export default function BottomNav({ hidden = false }) {
  const location = useLocation();

  const handleHomeClick = (event) => {
    if (location.pathname !== '/') return;
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className={`${classes.bottomNav} ${hidden ? classes.hidden : ''}`} aria-label="Navegación principal">
      <NavLink
        className={({ isActive }) => (isActive ? classes.active : '')}
        to="/"
        onClick={handleHomeClick}
      >
        <IconHome className={classes.icon} />
        <span className={classes.label}>Inicio</span>
      </NavLink>
      <NavLink className={({ isActive }) => (isActive ? classes.active : '')} to="/bible">
        <IconBook className={classes.icon} />
        <span className={classes.label}>Biblia</span>
      </NavLink>
      <NavLink className={({ isActive }) => (isActive ? classes.active : '')} to="/bookmarks">
        <IconBookmark className={classes.icon} />
        <span className={classes.label}>Favoritos</span>
      </NavLink>
      <NavLink className={({ isActive }) => (isActive ? classes.active : '')} to="/settings">
        <IconSettings className={classes.icon} />
        <span className={classes.label}>Ajustes</span>
      </NavLink>
    </nav>
  );
}

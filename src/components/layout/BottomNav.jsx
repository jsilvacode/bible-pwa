import React from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { IconHome, IconBook, IconBookmark, IconHeart, IconSettings } from '../ui/Icons';
import classes from './BottomNav.module.css';

export default function BottomNav({ hidden = false }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleHomeClick = (event) => {
    if (location.pathname !== '/') return;
    event.preventDefault();
    navigate('/');
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
      <Link className={classes.donateLink} to="/#donar">
        <IconHeart className={classes.icon} />
        <span className={classes.label}>Donar</span>
      </Link>
      <NavLink className={({ isActive }) => (isActive ? classes.active : '')} to="/settings">
        <IconSettings className={classes.icon} />
        <span className={classes.label}>Ajustes</span>
      </NavLink>
    </nav>
  );
}

import React from 'react';
import { NavLink } from 'react-router-dom';
import classes from './BottomNav.module.css';

export default function BottomNav() {
  return (
    <nav className={classes.bottomNav}>
      <NavLink className={({isActive}) => isActive ? classes.active : ''} to="/">Inicio</NavLink>
      <NavLink className={({isActive}) => isActive ? classes.active : ''} to="/search">Buscar</NavLink>
      <NavLink className={({isActive}) => isActive ? classes.active : ''} to="/bookmarks">Marcadores</NavLink>
      <NavLink className={({isActive}) => isActive ? classes.active : ''} to="/settings">Ajustes</NavLink>
    </nav>
  );
}

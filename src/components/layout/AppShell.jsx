import React from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import classes from './AppShell.module.css';

export default function AppShell() {
  return (
    <div className={classes.appShell}>
      <TopBar />
      <main className={classes.mainContent}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

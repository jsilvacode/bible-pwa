import React from 'react';
import DailyVerse from '../daily/DailyVerse';
import { useRecentReads } from '../../hooks/useSettings';
import { useNavigate } from 'react-router-dom';
import classes from './HomeScreen.module.css';

export default function HomeScreen() {
  const { recent } = useRecentReads();
  const navigate = useNavigate();

  return (
    <div className={classes.container}>
      <DailyVerse />
      
      <div className={classes.recentSection}>
        <h3 className={classes.title}>Lecturas Recientes</h3>
        {recent.length === 0 ? (
          <p className={classes.empty}>No tienes lecturas recientes.</p>
        ) : (
          <div className={classes.recentList}>
            {recent.map((r, i) => (
              <button 
                key={i} 
                className={classes.recentBtn}
                onClick={() => navigate(`/read/${r.book}/${r.chapter}`)}
              >
                📖 Libro {r.book}, Cap {r.chapter}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

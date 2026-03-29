import React, { useEffect, useState } from 'react';
import DailyVerse from '../daily/DailyVerse';
import { useRecentReads } from '../../hooks/useSettings';
import { useNavigate } from 'react-router-dom';
import classes from './HomeScreen.module.css';
import { fetchBooksManifest } from '../../services/bibleLoader';

export default function HomeScreen() {
  const { recent } = useRecentReads();
  const navigate = useNavigate();
  const [bookNames, setBookNames] = useState({});

  useEffect(() => {
    fetchBooksManifest()
      .then((books) => {
        const map = {};
        books.forEach((b) => { map[b.id] = b.name; });
        setBookNames(map);
      })
      .catch(console.error);
  }, []);

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
                📖 {bookNames[r.book] || `Libro ${r.book}`}, Cap {r.chapter}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

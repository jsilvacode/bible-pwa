import React, { useEffect, useState } from 'react';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useNavigate } from 'react-router-dom';
import classes from './BookmarksView.module.css';
import { fetchBooksManifest } from '../../services/bibleLoader';

export default function BookmarksView() {
  const { bookmarks, removeBookmark } = useBookmarks();
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
      <header className={classes.header}>
        <h2 className={classes.title}>Favoritos</h2>
        <p className={classes.subtitle}>{bookmarks.length} versículos guardados</p>
      </header>
      
      {bookmarks.length === 0 ? (
        <div className={classes.empty}>
          <div className={classes.emptyIcon}>🔖</div>
          <h3>Sin favoritos aún</h3>
          <p>Toca un versículo mientras lees para guardarlo en esta sección.</p>
          <button className={classes.goBible} onClick={() => navigate('/bible')}>Ir a la Biblia</button>
        </div>
      ) : (
        <div className={classes.list}>
          {bookmarks.map(b => (
            <div key={b.id} className={classes.item}>
              <div 
                className={classes.content}
                onClick={() => navigate(`/read/${b.book}/${b.chapter}/${b.verse}`)}
              >
                <div className={classes.itemHeader}>
                  <span className={classes.ref}>
                    {bookNames[b.book] || `Libro ${b.book}`} {b.chapter}:{b.verse}
                  </span>
                  <span className={classes.version}>{b.version.toUpperCase()}</span>
                </div>
                {b.text ? (
                  <p className={classes.preview}>"{b.text}"</p>
                ) : (
                  <p className={classes.preview}>Toca para leer el versículo...</p>
                )}
              </div>
              <button 
                className={classes.deleteBtn} 
                onClick={(e) => {
                  e.stopPropagation();
                  removeBookmark(b.id);
                }}
                aria-label="Eliminar"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

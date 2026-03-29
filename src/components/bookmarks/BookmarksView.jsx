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
        books.forEach((b) => {
          map[b.id] = b.name;
        });
        setBookNames(map);
      })
      .catch(console.error);
  }, []);

  return (
    <div className={classes.container}>
      <h2 className={classes.title}>Tus Marcadores</h2>
      
      {bookmarks.length === 0 ? (
        <div className={classes.empty}>
          <p>Aún no tienes marcadores guardados.</p>
        </div>
      ) : (
        <div className={classes.list}>
          {bookmarks.map(b => (
            <div key={b.id} className={classes.item}>
              <div 
                className={classes.reference}
                onClick={() => navigate(`/read/${b.book}/${b.chapter}/${b.verse}`)}
              >
                <div className={classes.refTag}>{b.version.toUpperCase()}</div> 
                {bookNames[b.book] || `Libro ${b.book}`}, Cap {b.chapter}:{b.verse}
              </div>
              <button 
                className={classes.deleteBtn} 
                onClick={(e) => {
                  e.stopPropagation();
                  removeBookmark(b.id);
                }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useNavigate } from 'react-router-dom';
import classes from './BookmarksView.module.css';

export default function BookmarksView() {
  const { bookmarks, removeBookmark } = useBookmarks();
  const navigate = useNavigate();

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
                Libro {b.book}, Cap {b.chapter}:{b.verse}
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

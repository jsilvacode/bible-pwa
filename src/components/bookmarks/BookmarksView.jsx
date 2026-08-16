import React from 'react';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useNavigate } from 'react-router-dom';
import { useBookNames } from '../../hooks/useBookNames';
import { EditorialPage, EditorialPanel } from '../layout/EditorialPage';
import { IconBookmark, IconChevronRight, IconX } from '../ui/Icons';
import classes from './BookmarksView.module.css';

export default function BookmarksView() {
  const { bookmarks, removeBookmark } = useBookmarks();
  const { bookNames } = useBookNames();
  const navigate = useNavigate();

  return (
    <EditorialPage
      eyebrow="Memoria de lectura"
      title="Favoritos"
      description={`${bookmarks.length} ${bookmarks.length === 1 ? 'versículo guardado' : 'versículos guardados'}`}
    >
      {bookmarks.length === 0 ? (
        <EditorialPanel className={classes.empty}>
          <div className={classes.emptyIcon} aria-hidden="true"><IconBookmark size={28} /></div>
          <h3>Sin favoritos aún</h3>
          <p>Toca un versículo mientras lees para guardarlo en esta sección.</p>
          <button type="button" className={classes.goBible} onClick={() => navigate('/bible')}>
            Ir a la Biblia
            <IconChevronRight size={17} aria-hidden="true" />
          </button>
        </EditorialPanel>
      ) : (
        <div className={classes.list}>
          {bookmarks.map((b) => (
            <article key={b.id} className={classes.item}>
              <button
                type="button"
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
                  <p className={classes.preview}>&quot;{b.text}&quot;</p>
                ) : (
                  <p className={classes.preview}>Toca para leer el versículo...</p>
                )}
              </button>
              <button
                type="button"
                className={classes.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  removeBookmark(b.id);
                }}
                aria-label="Eliminar"
              >
                <IconX size={18} aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
      )}
    </EditorialPage>
  );
}

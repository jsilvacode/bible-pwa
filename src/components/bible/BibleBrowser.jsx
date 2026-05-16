import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import classes from './BibleBrowser.module.css';
import { fetchBooksManifest } from '../../services/bibleLoader';
import { CATEGORY_LABELS, CATEGORY_RANGES } from '../../constants/bibleCategories';

export default function BibleBrowser() {
  const [books, setBooks] = useState([]);
  const [expandedBook, setExpandedBook] = useState(null);
  const [isOtExpanded, setIsOtExpanded] = useState(false);
  const [isNtExpanded, setIsNtExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Accept a category filter passed via navigation state
  const filterCategory = location.state?.category || null;
  const filterLabel = filterCategory ? CATEGORY_LABELS[filterCategory] : null;
  const filterRange = filterCategory ? CATEGORY_RANGES[filterCategory] : null;

  useEffect(() => {
    fetchBooksManifest().then(setBooks).catch(console.error);
  }, []);

  // If a category filter is active, auto-collapse sections not in the range
  useEffect(() => {
    if (!filterRange) return;
    const isOT = filterRange.min <= 39;
    const isNT = filterRange.max >= 40;
    setIsOtExpanded(isOT);
    setIsNtExpanded(isNT);
  }, [filterRange]);

  // Filter books based on active category
  const allOtBooks = books.filter(b => b.id >= 1 && b.id <= 39);
  const allNtBooks = books.filter(b => b.id >= 40 && b.id <= 66);

  const filterBooks = (list) => {
    if (!filterRange) return list;
    return list.filter(b => b.id >= filterRange.min && b.id <= filterRange.max);
  };

  const otBooks = filterBooks(allOtBooks);
  const ntBooks = filterBooks(allNtBooks);

  const renderBookList = (list) => (
    <div className={classes.bookGrid}>
      {list.map((b) => (
        <div key={b.id} className={`${classes.bookCard} ${expandedBook === b.id ? classes.expanded : ''}`}>
          <button
            className={classes.bookToggle}
            onClick={() => setExpandedBook(expandedBook === b.id ? null : b.id)}
          >
            <span className={classes.bookAbbrev}>{b.abbrev?.toUpperCase()}</span>
            <span className={classes.bookName}>{b.name}</span>
            <span className={classes.chevron}>{expandedBook === b.id ? '▾' : '▸'}</span>
          </button>

          {expandedBook === b.id && (
            <div className={classes.chapterGrid}>
              {Array.from({ length: b.chapters }, (_, i) => i + 1).map((c) => (
                <button
                  key={c}
                  className={classes.chapterBtn}
                  onClick={() => navigate(`/read/${b.id}/${c}`)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className={classes.container}>
      <header className={classes.header}>
        <h1 className={classes.title}>La Biblia</h1>
        {filterLabel ? (
          <div className={classes.filterBadge}>
            <span>{filterLabel}</span>
            <button
              className={classes.clearFilter}
              onClick={() => navigate('/bible', { replace: true })}
            >
              ✕
            </button>
          </div>
        ) : (
          <p className={classes.subtitle}>Selecciona un libro y capítulo</p>
        )}
      </header>

      {(otBooks.length > 0) && (
        <section className={classes.section}>
          <button className={classes.sectionHeader} onClick={() => setIsOtExpanded(!isOtExpanded)}>
            <h2>Antiguo Testamento</h2>
            <span>{isOtExpanded ? 'Colapsar' : 'Expandir'}</span>
          </button>
          {isOtExpanded && renderBookList(otBooks)}
        </section>
      )}

      {(ntBooks.length > 0) && (
        <section className={classes.section}>
          <button className={classes.sectionHeader} onClick={() => setIsNtExpanded(!isNtExpanded)}>
            <h2>Nuevo Testamento</h2>
            <span>{isNtExpanded ? 'Colapsar' : 'Expandir'}</span>
          </button>
          {isNtExpanded && renderBookList(ntBooks)}
        </section>
      )}
    </div>
  );
}

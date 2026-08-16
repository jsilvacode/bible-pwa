import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import classes from './BibleBrowser.module.css';
import { EditorialPage, EditorialPanel } from '../layout/EditorialPage';
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
  const testament = location.state?.testament || null;
  const filterLabel = filterCategory ? CATEGORY_LABELS[filterCategory] : null;
  const filterRange = filterCategory ? CATEGORY_RANGES[filterCategory] : null;

  useEffect(() => {
    let mounted = true;
    fetchBooksManifest()
      .then((list) => { if (mounted) setBooks(list); })
      .catch(console.error);
    return () => { mounted = false; };
  }, []);

  // If a category filter is active, auto-collapse sections not in the range
  useEffect(() => {
    if (filterRange) {
      const isOT = filterRange.min <= 39;
      const isNT = filterRange.max >= 40;
      setIsOtExpanded(isOT);
      setIsNtExpanded(isNT);
      return;
    }

    if (testament) {
      setIsOtExpanded(testament === 'old');
      setIsNtExpanded(testament === 'new');
    }
  }, [filterRange, testament]);

  // Filter books based on active category
  const allOtBooks = useMemo(() => books.filter(b => b.id >= 1 && b.id <= 39), [books]);
  const allNtBooks = useMemo(() => books.filter(b => b.id >= 40 && b.id <= 66), [books]);

  const filterBooks = useCallback((list) => {
    if (!filterRange) return list;
    return list.filter(b => b.id >= filterRange.min && b.id <= filterRange.max);
  }, [filterRange]);

  const otBooks = useMemo(() => filterBooks(allOtBooks), [filterBooks, allOtBooks]);
  const ntBooks = useMemo(() => filterBooks(allNtBooks), [filterBooks, allNtBooks]);

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
    <EditorialPage
      eyebrow="Biblioteca"
      title="Santa Biblia"
      description="Elige un testamento, un libro y luego el capítulo que quieres leer."
    >
      {filterLabel && (
        <div className={classes.filterBadge}>
          <span>{filterLabel}</span>
          <button
            className={classes.clearFilter}
            onClick={() => navigate('/bible', { replace: true })}
            aria-label="Quitar filtro"
          >
            ✕
          </button>
        </div>
      )}

      {(otBooks.length > 0) && (
      <EditorialPanel as="section" className={`${classes.section} ${classes.oldTestament}`}>
          <button
            className={classes.sectionHeader}
            onClick={() => setIsOtExpanded(!isOtExpanded)}
            aria-expanded={isOtExpanded}
          >
            <span className={classes.sectionMark} aria-hidden="true">AT</span>
            <span className={classes.sectionCopy}>
              <span>{otBooks.length} libros</span>
              <h2>Antiguo Testamento</h2>
            </span>
            <span className={classes.sectionAction}>{isOtExpanded ? 'Colapsar' : 'Explorar'} <b aria-hidden="true">→</b></span>
          </button>
          {isOtExpanded && renderBookList(otBooks)}
        </EditorialPanel>
      )}

      {(ntBooks.length > 0) && (
      <EditorialPanel as="section" className={`${classes.section} ${classes.newTestament}`}>
          <button
            className={classes.sectionHeader}
            onClick={() => setIsNtExpanded(!isNtExpanded)}
            aria-expanded={isNtExpanded}
          >
            <span className={classes.sectionMark} aria-hidden="true">NT</span>
            <span className={classes.sectionCopy}>
              <span>{ntBooks.length} libros</span>
              <h2>Nuevo Testamento</h2>
            </span>
            <span className={classes.sectionAction}>{isNtExpanded ? 'Colapsar' : 'Explorar'} <b aria-hidden="true">→</b></span>
          </button>
          {isNtExpanded && renderBookList(ntBooks)}
        </EditorialPanel>
      )}
    </EditorialPage>
  );
}

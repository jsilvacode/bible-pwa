import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import classes from './SearchModal.module.css';
import { useSearch } from '../../hooks/useSearch';
import { useSettings } from '../../hooks/useSettings';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useModalDismiss } from '../../hooks/useModalDismiss';
import { fetchBooksManifest, loadBibleBook } from '../../services/bibleLoader';
import { normalizeDisplayedText } from '../../utils/textNormalizer';
import { createBookAliases, parseBibleReference } from '../../utils/bibleReference';

export default function SearchModal({ isOpen, onClose }) {
  const { settings } = useSettings();
  const { search, results, loading, cancelSearch } = useSearch(settings.version);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [booksById, setBooksById] = useState({});
  const [bookAliasMap, setBookAliasMap] = useState(() => new Map());
  const [searchFeedback, setSearchFeedback] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const modalRef = useRef(null);

  useFocusTrap(modalRef, isOpen);
  useModalDismiss(isOpen, onClose);

  useEffect(() => {
    fetchBooksManifest()
      .then((books) => {
        const byId = {};
        books.forEach((b) => { byId[b.id] = b; });
        setBooksById(byId);
        setBookAliasMap(createBookAliases(books));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const input = document.getElementById('search-modal-input');
      if (input) input.focus();
    }
  }, [isOpen]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchFeedback('Escribe una palabra o cita');
      return;
    }

    const reference = parseBibleReference(trimmed, bookAliasMap, booksById);
    if (reference) {
      try {
        const bookData = await loadBibleBook(settings.version, reference.bookId);
        const chapterData = bookData.chapters.find(c => c.chapter === reference.chapter);
        if (!chapterData) {
          setSearchFeedback('No existe ese capítulo.');
          return;
        }
      } catch {
        setSearchFeedback('Error validando cita.');
        return;
      }

      const target = reference.verse
        ? `/read/${reference.bookId}/${reference.chapter}/${reference.verse}`
        : `/read/${reference.bookId}/${reference.chapter}`;
      navigate(target);
      onClose();
      return;
    }

    if (trimmed.length < 3) {
      setSearchFeedback('Escribe al menos 3 letras.');
      return;
    }

    setSearchFeedback('');
    setHasSearched(true);
    await search(trimmed);
  };

  const handleReset = () => {
    setQuery('');
    setSearchFeedback('');
    setHasSearched(false);
    cancelSearch();
  };

  if (!isOpen) return null;

  return (
    <div className={classes.overlay} onClick={onClose}>
      <div
        className={classes.modal}
        ref={modalRef}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-modal-title"
      >
        <button className={classes.closeIcon} onClick={onClose} aria-label="Cerrar">✕</button>
        <header className={classes.header}>
          <div className={classes.headerText}>
            <h2 className={classes.title} id="search-modal-title">Buscar</h2>
            <p className={classes.subtitle}>Encuentra palabras o citas bíblicas</p>
          </div>

          <form onSubmit={handleSearch} className={classes.form}>
            <div className={classes.inputWrapper}>
              <input
                id="search-modal-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='"mar", "juan 3", "job 1:2"'
                className={classes.input}
                autoComplete="off"
                aria-label="Buscar en la Biblia"
              />
              {query && <button type="button" className={classes.clear} onClick={handleReset} aria-label="Limpiar">✕</button>}
            </div>
            <div className={classes.actionRow}>
              <button type="submit" className={classes.searchBtn}>
                Buscar
              </button>
              <button type="button" className={classes.resetBtn} onClick={handleReset}>
                Limpiar
              </button>
            </div>
          </form>
        </header>

        <div className={classes.content}>
          {searchFeedback && <p className={classes.feedback}>{searchFeedback}</p>}

          {loading && (
            <div className={classes.loading} role="status" aria-live="polite">
              <span className={classes.spinner} aria-hidden="true" />
              <span>Buscando…</span>
            </div>
          )}

          <div className={classes.results}>
            {results.map((r) => (
              <button
                key={r.id}
                className={classes.resultItem}
                onClick={() => {
                  navigate(`/read/${r.book}/${r.chapter}/${r.verse}`);
                  onClose();
                }}
              >
                <div className={classes.resultHeader}>
                  <span className={classes.resultRef}>{r.bookName} {r.chapter}:{r.verse}</span>
                  <span className={classes.versionTag}>{settings.version.toUpperCase()}</span>
                </div>
                <p className={classes.resultText}>{normalizeDisplayedText(r.text)}</p>
              </button>
            ))}
          </div>

          {!loading && results.length === 0 && hasSearched && !searchFeedback && (
            <div className={classes.empty}>No se encontraron resultados para "{query}"</div>
          )}
        </div>
      </div>
    </div>
  );
}

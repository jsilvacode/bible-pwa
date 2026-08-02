import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconChevronRight, IconSearch, IconX } from '../ui/Icons';
import classes from './SearchModal.module.css';
import { useSearch } from '../../hooks/useSearch';
import { useSettings } from '../../hooks/useSettings';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useModalDismiss } from '../../hooks/useModalDismiss';
import { fetchBooksManifest } from '../../services/bibleLoader';
import { normalizeDisplayedText } from '../../utils/textNormalizer';
import { createBookAliases, parseBibleReference } from '../../utils/bibleReference';

export default function SearchModal({ isOpen, initialQuery = '', requestId = 0, onClose }) {
  const { settings } = useSettings();
  const { search, results, loading, truncated, cancelSearch } = useSearch(settings.version);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [booksById, setBooksById] = useState({});
  const [bookAliasMap, setBookAliasMap] = useState(() => new Map());
  const [searchFeedback, setSearchFeedback] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const modalRef = useRef(null);
  const inputRef = useRef(null);
  const handledRequestRef = useRef(0);

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

  const runSearch = useCallback(async (rawQuery) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) {
      setSearchFeedback('Escribe una palabra o cita');
      return;
    }

    const reference = parseBibleReference(trimmed, bookAliasMap, booksById);
    if (reference) {
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
  }, [bookAliasMap, booksById, navigate, onClose, search]);

  useEffect(() => {
    if (!isOpen) return;
    const resetTimer = window.setTimeout(() => {
      cancelSearch();
      setQuery(initialQuery);
      setSearchFeedback('');
      setHasSearched(false);
      inputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(resetTimer);
  }, [isOpen, initialQuery, requestId, cancelSearch]);

  useEffect(() => {
    const trimmed = initialQuery.trim();
    if (!isOpen || !trimmed || bookAliasMap.size === 0 || handledRequestRef.current === requestId) return;
    const autoSearchTimer = window.setTimeout(() => {
      handledRequestRef.current = requestId;
      runSearch(trimmed);
    }, 0);
    return () => window.clearTimeout(autoSearchTimer);
  }, [isOpen, initialQuery, requestId, bookAliasMap, runSearch]);

  const handleSearch = (event) => {
    event.preventDefault();
    runSearch(query);
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
        <header className={classes.header}>
          <div className={classes.headerTop}>
            <div className={classes.searchBadge} aria-hidden="true">
              <IconSearch size={20} />
            </div>
            <div className={classes.headerText}>
              <span className={classes.eyebrow}>Explora las Escrituras</span>
              <h2 className={classes.title} id="search-modal-title">Buscar en la Biblia</h2>
              <p className={classes.subtitle}>Encuentra palabras, versículos o citas bíblicas.</p>
            </div>
            <button className={classes.closeIcon} onClick={onClose} aria-label="Cerrar búsqueda">
              <IconX size={18} />
            </button>
          </div>

          <form onSubmit={handleSearch} className={classes.form}>
            <div className={classes.inputShell}>
              <IconSearch size={19} className={classes.inputIcon} />
              <input
                id="search-modal-input"
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Prueba con Juan 3:16 o una palabra"
                className={classes.input}
                autoComplete="off"
                aria-label="Buscar en la Santa Biblia"
              />
              {query && (
                <button type="button" className={classes.clear} onClick={handleReset} aria-label="Limpiar búsqueda">
                  <IconX size={16} />
                </button>
              )}
            </div>
            <div className={classes.actionRow}>
              <button type="submit" className={classes.searchBtn}>
                <span>Buscar</span>
                <IconChevronRight size={17} />
              </button>
              {query && (
                <button type="button" className={classes.resetBtn} onClick={handleReset}>
                  Limpiar
                </button>
              )}
            </div>
          </form>
          <p className={classes.searchHint}>También puedes escribir una referencia como <strong>Salmos 23</strong>.</p>
        </header>

        <div className={classes.content}>
          {searchFeedback && (
            <div className={classes.feedback} role="status" aria-live="polite">
              <span className={classes.feedbackMark} aria-hidden="true">!</span>
              <p>{searchFeedback}</p>
            </div>
          )}

          {loading && (
            <div className={classes.loading} role="status" aria-live="polite">
              <span className={classes.spinner} aria-hidden="true" />
              <span>Buscando…</span>
            </div>
          )}

          {!loading && hasSearched && results.length > 0 && (
            <div className={classes.resultsHeading}>
              <strong>Resultados encontrados</strong>
              <span>{results.length}{truncated ? '+' : ''}</span>
            </div>
          )}

          <div className={classes.results}>
            {results.map((r) => (
              <button
                key={r.id}
                className={classes.resultItem}
                aria-label={`Abrir ${r.bookName} ${r.chapter}:${r.verse}`}
                onClick={() => {
                  navigate(`/read/${r.book}/${r.chapter}/${r.verse}`);
                  onClose();
                }}
              >
                <div className={classes.resultMain}>
                  <div className={classes.resultHeader}>
                    <span className={classes.resultRef}>{r.bookName} {r.chapter}:{r.verse}</span>
                    <span className={classes.versionTag}>{settings.version.toUpperCase()}</span>
                  </div>
                  <p className={classes.resultText}>{normalizeDisplayedText(r.text)}</p>
                </div>
                <IconChevronRight size={19} className={classes.resultArrow} />
              </button>
            ))}
          </div>

          {!loading && truncated && (
            <p className={classes.resultLimit}>Mostrando los primeros 100 resultados.</p>
          )}

          {!loading && results.length === 0 && hasSearched && !searchFeedback && (
            <div className={classes.empty}>
              <span className={classes.emptyIcon} aria-hidden="true"><IconSearch size={22} /></span>
              <strong>No encontramos resultados</strong>
              <p>Prueba con otra palabra o una referencia distinta.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

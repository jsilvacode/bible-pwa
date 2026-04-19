import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classes from './SearchModal.module.css';
import { useSearch } from '../../hooks/useSearch';
import { useSettings } from '../../hooks/useSettings';
import { fetchBooksManifest, loadBibleBook } from '../../services/bibleLoader';
import { normalizeDisplayedText } from '../../utils/textNormalizer';

function normalizeBookKey(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createBookAliases(books) {
  const aliasMap = new Map();
  const romanMap = { '1': 'i', '2': 'ii', '3': 'iii' };

  books.forEach((book) => {
    const aliases = new Set([
      normalizeBookKey(book.name),
      normalizeBookKey(book.slug),
      normalizeBookKey(book.abbrev),
    ]);

    const numbered = normalizeBookKey(book.name).match(/^([1-3])\s+(.+)$/);
    if (numbered) {
      const [, n, rest] = numbered;
      aliases.add(`${n} ${rest}`);
      aliases.add(`${n}${rest}`);
      aliases.add(`${romanMap[n]} ${rest}`);
      aliases.add(`${romanMap[n]}${rest}`);
    }

    aliases.forEach((alias) => {
      if (!alias) return;
      aliasMap.set(alias, book.id);
      aliasMap.set(alias.replace(/\s+/g, ''), book.id);
    });
  });

  return aliasMap;
}

function parseReference(query, aliasMap, booksById) {
  const cleaned = String(query)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/([a-z])([0-9])/g, '$1 $2')
    .replace(/\s*:\s*/g, ':')
    .replace(/[^a-z0-9:\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const match = cleaned.match(/^(.+?)\s+(\d+)(?:\s*:\s*(\d+))?$/);
  if (!match) return null;

  const [, rawBook, rawChapter, rawVerse] = match;
  const bookKey = rawBook.trim();
  const bookId = aliasMap.get(bookKey) || aliasMap.get(bookKey.replace(/\s+/g, ''));
  if (!bookId) return null;

  const chapter = Number(rawChapter);
  const verse = rawVerse ? Number(rawVerse) : null;
  if (!chapter || chapter < 1) return null;
  if (verse !== null && (!verse || verse < 1)) return null;

  const bookMeta = booksById[bookId];
  if (!bookMeta || chapter > bookMeta.chapters) return null;

  return { bookId, chapter, verse };
}

export default function SearchModal({ isOpen, onClose }) {
  const { settings } = useSettings();
  const { search, results, loading } = useSearch(settings.version);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [booksById, setBooksById] = useState({});
  const [bookAliasMap, setBookAliasMap] = useState(() => new Map());
  const [searchFeedback, setSearchFeedback] = useState('');

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
      document.body.style.overflow = 'hidden';
      const input = document.getElementById('search-modal-input');
      if (input) input.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchFeedback('Escribe una palabra o cita');
      return;
    }

    const reference = parseReference(trimmed, bookAliasMap, booksById);
    if (reference) {
      try {
        const bookData = await loadBibleBook(settings.version, reference.bookId);
        const chapterData = bookData.chapters.find(c => c.chapter === reference.chapter);
        if (!chapterData) {
          setSearchFeedback('No existe ese capítulo.');
          return;
        }
      } catch (err) {
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
    await search(trimmed);
  };

  if (!isOpen) return null;

  return (
    <div className={classes.overlay} onClick={onClose}>
      <div className={classes.modal} onClick={e => e.stopPropagation()}>
        <header className={classes.header}>
          <form onSubmit={handleSearch} className={classes.form}>
            <input
              id="search-modal-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por palabra o cita..."
              className={classes.input}
            />
            {query && <button type="button" className={classes.clear} onClick={() => setQuery('')}>✕</button>}
          </form>
          <button className={classes.close} onClick={onClose}>Cancelar</button>
        </header>

        <div className={classes.content}>
          {searchFeedback && <p className={classes.feedback}>{searchFeedback}</p>}
          {loading && <div className={classes.loading}>Buscando...</div>}
          
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

          {!loading && results.length === 0 && query.length >= 3 && !searchFeedback && (
            <div className={classes.empty}>No se encontraron resultados para "{query}"</div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import DailyVerse from '../daily/DailyVerse';
import { useRecentReads } from '../../hooks/useSettings';
import { useSearch } from '../../hooks/useSearch';
import { useSettings } from '../../hooks/useSettings';
import { useNavigate } from 'react-router-dom';
import classes from './HomeScreen.module.css';
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

export default function HomeScreen() {
  const { recent } = useRecentReads();
  const { settings } = useSettings();
  const { search, results, loading } = useSearch(settings.version);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [bookNames, setBookNames] = useState({});
  const [booksById, setBooksById] = useState({});
  const [bookAliasMap, setBookAliasMap] = useState(() => new Map());
  const [searchFeedback, setSearchFeedback] = useState('');

  useEffect(() => {
    fetchBooksManifest()
      .then((books) => {
        const namesMap = {};
        const byId = {};
        books.forEach((b) => {
          namesMap[b.id] = b.name;
          byId[b.id] = b;
        });
        setBookNames(namesMap);
        setBooksById(byId);
        setBookAliasMap(createBookAliases(books));
      })
      .catch(console.error);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchFeedback('Escribe una palabra o cita, por ejemplo: Juan 3:16');
      return;
    }

    const reference = parseReference(trimmed, bookAliasMap, booksById);
    if (reference) {
      try {
        const bookData = await loadBibleBook(settings.version, reference.bookId);
        const chapterData = bookData.chapters.find(c => c.chapter === reference.chapter);
        if (!chapterData) {
          setSearchFeedback('No existe ese capítulo en el libro indicado.');
          return;
        }
        if (reference.verse && !chapterData.verses.some(v => v.verse === reference.verse)) {
          setSearchFeedback('No existe ese versículo en el capítulo indicado.');
          return;
        }
      } catch (err) {
        console.error('Error validando cita', err);
        setSearchFeedback('No se pudo validar la cita. Intenta nuevamente.');
        return;
      }

      const target = reference.verse
        ? `/read/${reference.bookId}/${reference.chapter}/${reference.verse}`
        : `/read/${reference.bookId}/${reference.chapter}`;
      navigate(target);
      return;
    }

    if (trimmed.length < 3) {
      setSearchFeedback('Para buscar por palabra escribe al menos 3 letras.');
      return;
    }

    setSearchFeedback('');
    await search(trimmed);
  };

  const handleClear = async () => {
    setQuery('');
    setSearchFeedback('');
    await search('');
  };

  return (
    <div className={classes.container}>
      <section className={classes.searchSection}>
        <h3 className={classes.title}>Buscar en la Biblia</h3>
        <form onSubmit={handleSearch} className={classes.searchForm}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Palabra o cita (ej: Juan 3:16)"
            className={classes.searchInput}
            aria-label="Buscar palabra o cita bíblica"
          />
          <button
            type="submit"
            className={classes.searchBtn}
            disabled={loading}
            aria-label={loading ? 'Buscando' : 'Buscar'}
            title={loading ? 'Buscando' : 'Buscar'}
          >
            {loading ? '⏳' : '🔍'}
          </button>
          <button
            type="button"
            className={classes.clearBtn}
            onClick={handleClear}
            aria-label="Limpiar búsqueda"
            title="Limpiar búsqueda"
            disabled={!query.trim() && results.length === 0 && !searchFeedback}
          >
            🧹
          </button>
        </form>
        <p className={classes.helper}>
          Puedes buscar por palabra o por cita: Juan 3:16, Salmos 23, 1 Juan 2:1.
        </p>
        {searchFeedback && <p className={classes.status}>{searchFeedback}</p>}
        {loading && <p className={classes.status}>Buscando coincidencias, por favor espera...</p>}
        {!loading && results.length > 0 && (
          <>
            <p className={classes.status}>Se encontraron {results.length} coincidencias</p>
            <div className={classes.resultList}>
              {results.map((r) => (
                <button
                  key={r.id}
                  className={classes.resultItem}
                  onClick={() => navigate(`/read/${r.book}/${r.chapter}/${r.verse}`)}
                >
                  <span className={classes.resultRef}>{r.bookName} {r.chapter}:{r.verse}</span>
                  <span className={classes.resultSnippet}>{normalizeDisplayedText(r.text)}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {!loading && results.length === 0 && query.trim().length >= 3 && !searchFeedback && (
          <p className={classes.status}>No se encontraron resultados para esa búsqueda.</p>
        )}
      </section>

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

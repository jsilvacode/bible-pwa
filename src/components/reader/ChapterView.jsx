import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBible } from '../../hooks/useBible';
import { useHighlights } from '../../hooks/useHighlights';
import { useSettings } from '../../hooks/useSettings';
import VerseBlock from './VerseBlock';
import VerseMenu from './VerseMenu';
import SkeletonChapter from './SkeletonChapter';
import ReaderFAB from './ReaderFAB';
import classes from './ChapterView.module.css';
import { fetchBooksManifest } from '../../services/bibleLoader';

export default function ChapterView() {
  const { book: bookId, chapter: chapterNum, verse: targetVerse } = useParams();
  const navigate = useNavigate();
  const { settings, addRecent } = useSettings();

  // useBible(version, bookId) → { data, loading, error }
  // data has: { name, chapters: [{chapter, verses: [{verse, text}]}] }
  const { data, loading, error } = useBible(settings.version, bookId);

  // useHighlights(version, book, chapter) → { highlights: {verseNum: color}, setHighlight }
  const { highlights, setHighlight } = useHighlights(settings.version, bookId, chapterNum);

  const [menuVerse, setMenuVerse] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [bookNames, setBookNames] = useState({});

  const bookId_ = Number(bookId);
  const chapterNum_ = Number(chapterNum);

  // Derive chapter data from the loaded book
  const bibleBook = data;
  const bibleChapter = data?.chapters?.find(c => c.chapter === chapterNum_);

  useEffect(() => {
    fetchBooksManifest()
      .then(books => {
        const map = {};
        books.forEach(b => { map[b.id] = b.name; });
        setBookNames(map);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!loading && bibleBook && bibleChapter) {
      addRecent(bookId_, chapterNum_);
      if (targetVerse) {
        const timer = setTimeout(() => {
          const el = document.getElementById(`verse-${targetVerse}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
        return () => clearTimeout(timer);
      } else {
        window.scrollTo(0, 0);
      }
    }
  }, [bookId_, chapterNum_, loading, bibleBook, bibleChapter, targetVerse, addRecent]);

  useEffect(() => {
    const handleScroll = () => {
      const h = document.documentElement;
      const st = h.scrollTop || document.body.scrollTop;
      const sh = h.scrollHeight || document.body.scrollHeight;
      const raw = (st / (sh - h.clientHeight)) * 100;
      setScrollProgress(isFinite(raw) ? raw : 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePrevChapter = () => {
    if (chapterNum_ > 1) {
      navigate(`/read/${bookId}/${chapterNum_ - 1}`);
    } else if (bookId_ > 1) {
      navigate(`/read/${bookId_ - 1}/1`);
    }
  };

  const handleNextChapter = () => {
    const totalChapters = bibleBook?.chapters?.length || 0;
    if (chapterNum_ < totalChapters) {
      navigate(`/read/${bookId}/${chapterNum_ + 1}`);
    } else if (bookId_ < 66) {
      navigate(`/read/${bookId_ + 1}/1`);
    }
  };

  const handleOpenMenu = (verseNum) => setMenuVerse(verseNum);
  const handleCloseMenu = () => setMenuVerse(null);

  const bookName = bookNames[bookId_] || bibleBook?.name || `Libro ${bookId}`;

  if (error) return <div className={classes.error}>Error cargando el capítulo.</div>;

  return (
    <div className={classes.container}>
      {loading ? (
        <SkeletonChapter />
      ) : (
        <>
          <div className={classes.progressBar} style={{ width: `${scrollProgress}%` }} />

          <header className={classes.header}>
            <div className={classes.navLinks}>
              <button onClick={() => navigate('/bible')} className={classes.backBtn}>← Libros</button>
            </div>
            <h1 className={classes.title}>{bookName} {chapterNum_}</h1>
          </header>

          <main className={classes.readerMain}>
            <div className={classes.content}>
              {bibleChapter?.verses.map((v) => (
                <VerseBlock
                  key={v.verse}
                  verse={v.verse}
                  text={v.text}
                  isSelected={menuVerse === v.verse}
                  isHighlighted={!!highlights[v.verse]}
                  highlightColor={highlights[v.verse]}
                  onShortTap={handleOpenMenu}
                  onLongTap={handleOpenMenu}
                  onOpenMenu={handleOpenMenu}
                />
              ))}
              {!bibleChapter && (
                <p style={{ padding: '40px 20px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Capítulo {chapterNum_} no encontrado en este libro.
                </p>
              )}
            </div>

            <nav className={classes.navigation}>
              <button
                onClick={handlePrevChapter}
                disabled={bookId_ === 1 && chapterNum_ === 1}
                className={classes.navBtn}
              >
                Anterior
              </button>
              <button
                onClick={handleNextChapter}
                disabled={bookId_ === 66 && chapterNum_ === (bibleBook?.chapters?.length || 0)}
                className={classes.navBtn}
              >
                Siguiente
              </button>
            </nav>
          </main>

          <ReaderFAB />

          {menuVerse !== null && (
            <VerseMenu
              verse={menuVerse}
              payload={{
                id: `${settings.version}-${bookId_}-${chapterNum_}-${menuVerse}`,
                book: bookId_,
                chapter: chapterNum_,
                verse: menuVerse,
                text: bibleChapter?.verses.find(v => v.verse === menuVerse)?.text || '',
                bookName,
                version: settings.version,
                // VerseMenu calls payload.onHighlight(color) → we delegate to useHighlights
                onHighlight: (color) => setHighlight(
                  {
                    id: `${settings.version}-${bookId_}-${chapterNum_}-${menuVerse}`,
                    book: bookId_,
                    chapter: chapterNum_,
                    verse: menuVerse,
                    version: settings.version,
                  },
                  color
                ),
              }}
              onClose={handleCloseMenu}
            />
          )}
        </>
      )}
    </div>
  );
}

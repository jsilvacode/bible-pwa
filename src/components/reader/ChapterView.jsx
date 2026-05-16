import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useBible } from '../../hooks/useBible';
import { useHighlights } from '../../hooks/useHighlights';
import { useSettings } from '../../hooks/useSettings';
import VerseBlock from './VerseBlock';
import VerseMenu from './VerseMenu';
import CbaModal from './CbaModal';
import SkeletonChapter from './SkeletonChapter';
import ReaderFAB from './ReaderFAB';
import classes from './ChapterView.module.css';
import { getBookName, getTotalBooks, loadBibleBook } from '../../services/bibleLoader';

export default function ChapterView() {
  const { book: bookId, chapter: chapterNum, verse: targetVerse } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, addRecent, updateSettings } = useSettings();

  const { data, loading, error } = useBible(settings.version, bookId);
  const { highlights, setHighlight } = useHighlights(settings.version, bookId, chapterNum);

  const [menuVerse, setMenuVerse] = useState(null);
  const [cbaVerse, setCbaVerse] = useState(null);
  const [showCba, setShowCba] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const bookId_ = Number(bookId);
  const chapterNum_ = Number(chapterNum);

  const bibleBook = data;
  const bibleChapter = data?.chapters?.find(c => c.chapter === chapterNum_);

  useEffect(() => {
    if (!loading && bibleBook && bibleChapter) {
      addRecent(bookId_, chapterNum_);
      updateSettings({ lastRead: { book: bookId_, chapter: chapterNum_ } });
      
      const params = new URLSearchParams(location.search);
      if (params.get('showCba') === 'true' && targetVerse) {
        setCbaVerse(Number(targetVerse));
        setShowCba(true);
      }

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
  }, [bookId_, chapterNum_, loading, bibleBook, bibleChapter, targetVerse, addRecent, updateSettings, location.search]);

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

  const handlePrevChapter = async () => {
    if (chapterNum_ > 1) {
      navigate(`/read/${bookId}/${chapterNum_ - 1}`);
      return;
    }
    if (bookId_ <= 1) return;

    try {
      const prevBook = await loadBibleBook(settings.version, bookId_ - 1);
      const lastChapter = prevBook?.chapters?.length || 1;
      navigate(`/read/${bookId_ - 1}/${lastChapter}`);
    } catch {
      navigate(`/read/${bookId_ - 1}/1`);
    }
  };

  const handleNextChapter = () => {
    const totalChapters = bibleBook?.chapters?.length || 0;
    const totalBooks = getTotalBooks();
    if (chapterNum_ < totalChapters) {
      navigate(`/read/${bookId}/${chapterNum_ + 1}`);
    } else if (bookId_ < totalBooks) {
      navigate(`/read/${bookId_ + 1}/1`);
    }
  };

  const handleOpenMenu = (verseNum) => setMenuVerse(verseNum);
  const handleCloseMenu = () => setMenuVerse(null);

  const bookName = bibleBook?.name || getBookName(bookId_);

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
                <React.Fragment key={v.verse}>
                  {v.heading && <h3 className={classes.verseHeading}>{v.heading}</h3>}
                  <VerseBlock
                    verse={v.verse}
                    text={v.text}
                    isSelected={menuVerse === v.verse}
                    isHighlighted={!!highlights[v.verse]}
                    highlightColor={highlights[v.verse]}
                    isTarget={Number(targetVerse) === v.verse}
                    onShortTap={handleOpenMenu}
                    onLongTap={handleOpenMenu}
                    onOpenMenu={handleOpenMenu}
                  />
                </React.Fragment>
              ))}
              {!bibleChapter && (
                <p className={classes.notFound}>
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
                disabled={bookId_ === getTotalBooks() && chapterNum_ === (bibleBook?.chapters?.length || 0)}
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
                onOpenCba: () => {
                  setCbaVerse(menuVerse);
                  setShowCba(true);
                },
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

          <CbaModal
            isOpen={showCba}
            onClose={() => setShowCba(false)}
            bookId={bookId_}
            chapter={chapterNum_}
            verse={cbaVerse}
            bookName={bookName}
          />
        </>
      )}
    </div>
  );
}

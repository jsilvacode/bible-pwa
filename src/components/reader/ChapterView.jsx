import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useBible } from '../../hooks/useBible';
import { useHighlights } from '../../hooks/useHighlights';
import { useSettings } from '../../hooks/useSettings';
import { useReadingMode } from '../../hooks/useReadingMode';
import VerseBlock from './VerseBlock';
import VerseMenu from './VerseMenu';
import CbaModal from './CbaModal';
import SkeletonChapter from './SkeletonChapter';
import ReaderFAB from './ReaderFAB';
import classes from './ChapterView.module.css';
import { fetchBooksManifest, getBookName, getTotalBooks, loadBibleBook } from '../../services/bibleLoader';
import { validateReadRoute, validateVerseParam } from '../../utils/routeValidation';
import { throttle } from '../../utils/throttle';

export default function ChapterView() {
  const { book: bookId, chapter: chapterNum, verse: targetVerse } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, addRecent, updateSettings } = useSettings();
  const { setChromeHidden, setReaderActive } = useReadingMode();

  const [routeValid, setRouteValid] = useState(null);
  const [menuVerse, setMenuVerse] = useState(null);
  const [cbaVerse, setCbaVerse] = useState(null);
  const [showCba, setShowCba] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const lastChapterKeyRef = useRef('');
  const lastScrollYRef = useRef(0);
  const touchStartRef = useRef(null);
  const readerRef = useRef(null);

  const bookId_ = routeValid?.bookId ?? Number(bookId);
  const chapterNum_ = routeValid?.chapter ?? Number(chapterNum);

  const { data, loading, error } = useBible(
    routeValid?.valid ? settings.version : null,
    routeValid?.valid ? bookId_ : null
  );
  const { highlights, setHighlight } = useHighlights(settings.version, bookId_, chapterNum_);

  const bibleBook = data;
  const bibleChapter = data?.chapters?.find((c) => c.chapter === chapterNum_);

  useEffect(() => {
    setReaderActive(true);
    return () => {
      setReaderActive(false);
      setChromeHidden(false);
    };
  }, [setReaderActive, setChromeHidden]);

  useEffect(() => {
    let mounted = true;
    fetchBooksManifest()
      .then((books) => {
        if (!mounted) return;
        const validation = validateReadRoute(bookId, chapterNum, books);
        setRouteValid(validation);
        if (!validation.valid) {
          navigate('/bible', { replace: true });
        }
      })
      .catch(() => {
        if (mounted) navigate('/bible', { replace: true });
      });
    return () => { mounted = false; };
  }, [bookId, chapterNum, navigate]);

  useEffect(() => {
    if (!loading && bibleBook && bibleChapter && routeValid?.valid) {
      addRecent(bookId_, chapterNum_);
      updateSettings({ lastRead: { book: bookId_, chapter: chapterNum_ } });

      const params = new URLSearchParams(location.search);
      if (params.get('showCba') === 'true' && targetVerse) {
        setCbaVerse(Number(targetVerse));
        setShowCba(true);
      }

      const verseNum = validateVerseParam(targetVerse);
      if (verseNum) {
        const timer = setTimeout(() => {
          const el = document.getElementById(`verse-${verseNum}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
        return () => clearTimeout(timer);
      }

      const chapterKey = `${bookId_}-${chapterNum_}`;
      if (lastChapterKeyRef.current !== chapterKey) {
        lastChapterKeyRef.current = chapterKey;
        window.scrollTo(0, 0);
      }
    }
  }, [bookId_, chapterNum_, loading, bibleBook, bibleChapter, targetVerse, addRecent, updateSettings, location.search, routeValid]);

  useEffect(() => {
    const handleScroll = throttle(() => {
      const h = document.documentElement;
      const st = h.scrollTop || document.body.scrollTop;
      const sh = h.scrollHeight || document.body.scrollHeight;
      const raw = (st / (sh - h.clientHeight)) * 100;
      setScrollProgress(Number.isFinite(raw) ? raw : 0);

      const delta = st - lastScrollYRef.current;
      if (st > 80 && delta > 8) {
        setChromeHidden(true);
      } else if (delta < -8 || st < 40) {
        setChromeHidden(false);
      }
      lastScrollYRef.current = st;
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setChromeHidden]);

  const handlePrevChapter = useCallback(async () => {
    if (chapterNum_ > 1) {
      navigate(`/read/${bookId_}/${chapterNum_ - 1}`);
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
  }, [bookId_, chapterNum_, navigate, settings.version]);

  const handleNextChapter = useCallback(() => {
    const totalChapters = bibleBook?.chapters?.length || 0;
    const totalBooks = getTotalBooks();
    if (chapterNum_ < totalChapters) {
      navigate(`/read/${bookId_}/${chapterNum_ + 1}`);
    } else if (bookId_ < totalBooks) {
      navigate(`/read/${bookId_ + 1}/1`);
    }
  }, [bibleBook, bookId_, chapterNum_, navigate]);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    if (dt > 500 || Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx)) return;

    if (dx < -80) handleNextChapter();
    else if (dx > 80) handlePrevChapter();
  };

  const handleOpenMenu = (verseNum) => setMenuVerse(verseNum);
  const handleCloseMenu = () => setMenuVerse(null);

  const bookName = bibleBook?.name || getBookName(bookId_);

  if (routeValid && !routeValid.valid) return null;
  if (error) return <div className={classes.error}>Error cargando el capítulo.</div>;

  return (
    <div
      className={classes.container}
      ref={readerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {loading ? (
        <SkeletonChapter />
      ) : (
        <>
          <progress
            className={classes.progressBar}
            max={100}
            value={Math.max(0, Math.min(100, scrollProgress))}
            aria-label="Progreso de lectura"
          />

          <header className={classes.header}>
            <div className={classes.navLinks}>
              <button type="button" onClick={() => navigate('/bible')} className={classes.backBtn}>
                ← Libros
              </button>
            </div>
            <h1 className={classes.title}>{bookName} {chapterNum_}</h1>
            <span className={classes.versionBadge}>{settings.version.toUpperCase()}</span>
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

            <nav className={classes.navigation} aria-label="Navegación de capítulos">
              <button
                type="button"
                onClick={handlePrevChapter}
                disabled={bookId_ === 1 && chapterNum_ === 1}
                className={classes.navBtn}
              >
                Anterior
              </button>
              <button
                type="button"
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
                id: `${bookId_}-${chapterNum_}-${menuVerse}`,
                book: bookId_,
                chapter: chapterNum_,
                verse: menuVerse,
                text: bibleChapter?.verses.find((v) => v.verse === menuVerse)?.text || '',
                bookName,
                version: settings.version,
                onOpenCba: () => {
                  setCbaVerse(menuVerse);
                  setShowCba(true);
                },
                onHighlight: (color) => setHighlight(
                  {
                    id: `${bookId_}-${chapterNum_}-${menuVerse}`,
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

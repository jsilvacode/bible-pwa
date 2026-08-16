import React, { lazy, Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useBible } from '../../hooks/useBible';
import { useHighlights } from '../../hooks/useHighlights';
import { useSettings } from '../../hooks/useSettings';
import { useReadingMode } from '../../hooks/useReadingMode';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import VerseBlock from './VerseBlock';
import VerseMenu from './VerseMenu';
import SkeletonChapter from './SkeletonChapter';
import ReaderFAB from './ReaderFAB';
import classes from './ChapterView.module.css';
import { fetchBooksManifest, getBookChapterCount, getBookName, getTotalBooks, loadBibleChapter } from '../../services/bibleLoader';
import { validateReadRoute, validateVerseParam } from '../../utils/routeValidation';
import { buildVerseReference, buildCopyText, buildCopyHtml, buildVerseShareUrl } from '../../utils/verseCopy';

const CbaModal = lazy(() => import('./CbaModal'));

function canPrefetchChapter() {
  if (typeof navigator === 'undefined' || navigator.onLine === false) return false;

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return !connection?.saveData && !['slow-2g', '2g'].includes(connection?.effectiveType);
}

export default function ChapterView() {
  const { book: bookId, chapter: chapterNum, verse: targetVerse } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, addRecent, updateSettings } = useSettings();
  const { isOpen: searchOpen } = useGlobalSearch();
  const {
    readerControlsIdle,
    setReaderControlsIdle,
    setReaderAtEnd,
    setChromeHidden,
    setReaderActive,
  } = useReadingMode();

  const [routeValid, setRouteValid] = useState(null);
  const [menuVerse, setMenuVerse] = useState(null);
  const [cbaVerse, setCbaVerse] = useState(null);
  const [showCba, setShowCba] = useState(false);
  const [chapterNavigationVisible, setChapterNavigationVisible] = useState(false);
  const [readerSettingsOpen, setReaderSettingsOpen] = useState(false);
  const lastChapterKeyRef = useRef('');
  const lastScrollYRef = useRef(0);
  const touchStartRef = useRef(null);
  const readerRef = useRef(null);
  const chapterNavigationRef = useRef(null);
  const progressRef = useRef(null);
  const scrollFrameRef = useRef(0);
  const readerAtEndRef = useRef(null);
  const chapterNavigationVisibleRef = useRef(false);
  const chromeHiddenRef = useRef(false);

  const bookId_ = routeValid?.bookId ?? Number(bookId);
  const chapterNum_ = routeValid?.chapter ?? Number(chapterNum);

  const { data, loading, error } = useBible(
    routeValid?.valid ? settings.version : null,
    routeValid?.valid ? bookId_ : null,
    routeValid?.valid ? chapterNum_ : null
  );
  const { highlights, setHighlight } = useHighlights(settings.version, bookId_, chapterNum_);

  const bibleBook = data;
  const bibleChapter = data?.chapters?.find((c) => c.chapter === chapterNum_);
  const controlsLockedOpen = menuVerse !== null || showCba || searchOpen || readerSettingsOpen;

  useEffect(() => {
    setReaderActive(true);
    return () => {
      setReaderActive(false);
      setChromeHidden(false);
    };
  }, [setReaderActive, setChromeHidden]);

  useEffect(() => {
    setRouteValid(null);
    setMenuVerse(null);
    setCbaVerse(null);
    setShowCba(false);
    setReaderSettingsOpen(false);
    setChapterNavigationVisible(false);
    chapterNavigationVisibleRef.current = false;
    readerAtEndRef.current = false;
    setReaderAtEnd(false);
    chromeHiddenRef.current = false;
    setChromeHidden(false);

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
  }, [bookId, chapterNum, navigate, setChromeHidden, setReaderAtEnd]);

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
        lastScrollYRef.current = 0;
        if (progressRef.current) progressRef.current.value = 0;
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    }
  }, [bookId_, chapterNum_, loading, bibleBook, bibleChapter, targetVerse, addRecent, updateSettings, location.search, routeValid]);

  useEffect(() => {
    if (loading || !bibleChapter || !routeValid?.valid || !canPrefetchChapter()) return undefined;

    const chapterCount = getBookChapterCount(bookId_) || bibleBook?.chapterCount || 0;
    const totalBooks = getTotalBooks();
    const nextTarget = chapterNum_ < chapterCount
      ? { book: bookId_, chapter: chapterNum_ + 1 }
      : bookId_ < totalBooks
        ? { book: bookId_ + 1, chapter: 1 }
        : null;

    if (!nextTarget) return undefined;

    const prefetch = () => {
      loadBibleChapter(settings.version, nextTarget.book, nextTarget.chapter).catch(() => {
        // La navegación seguirá cargando normalmente si el precalentamiento no está disponible.
      });
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(prefetch, { timeout: 1800 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(prefetch, 450);
    return () => window.clearTimeout(timeoutId);
  }, [bibleBook, bibleChapter, bookId_, chapterNum_, loading, routeValid, settings.version]);

  useEffect(() => {
    const updateScrollState = () => {
      scrollFrameRef.current = 0;
      const h = document.documentElement;
      const st = h.scrollTop || document.body.scrollTop;
      const sh = h.scrollHeight || document.body.scrollHeight;
      const raw = (st / (sh - h.clientHeight)) * 100;
      const progress = Math.max(0, Math.min(100, Number.isFinite(raw) ? raw : 0));
      if (progressRef.current) progressRef.current.value = progress;

      const atEnd = chapterNavigationVisibleRef.current || sh - (st + h.clientHeight) <= 96;
      if (readerAtEndRef.current !== atEnd) {
        readerAtEndRef.current = atEnd;
        setReaderAtEnd(atEnd);
      }

      const delta = st - lastScrollYRef.current;
      let chromeShouldHide = chromeHiddenRef.current;
      if (st > 80 && delta > 8) {
        chromeShouldHide = true;
      } else if (delta < -8 || st < 40) {
        chromeShouldHide = false;
      }
      if (chromeHiddenRef.current !== chromeShouldHide) {
        chromeHiddenRef.current = chromeShouldHide;
        setChromeHidden(chromeShouldHide);
      }
      lastScrollYRef.current = st;
    };

    const requestScrollUpdate = () => {
      if (!scrollFrameRef.current) {
        scrollFrameRef.current = window.requestAnimationFrame(updateScrollState);
      }
    };

    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    window.addEventListener('resize', requestScrollUpdate);
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(requestScrollUpdate)
      : null;
    if (resizeObserver && readerRef.current) resizeObserver.observe(readerRef.current);
    requestScrollUpdate();
    return () => {
      window.removeEventListener('scroll', requestScrollUpdate);
      window.removeEventListener('resize', requestScrollUpdate);
      resizeObserver?.disconnect();
      if (scrollFrameRef.current) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = 0;
      }
    };
  }, [loading, setChromeHidden, setReaderAtEnd]);

  useEffect(() => {
    let idleTimer;
    let lastActivityAt = 0;

    const scheduleIdle = () => {
      window.clearTimeout(idleTimer);
      if (!controlsLockedOpen) {
        idleTimer = window.setTimeout(() => setReaderControlsIdle(true), 3000);
      }
    };

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityAt < 180) return;
      lastActivityAt = now;
      setReaderControlsIdle(false);
      scheduleIdle();
    };

    const passiveEvents = ['scroll', 'pointerdown'];
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (finePointer) passiveEvents.push('pointermove');
    passiveEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });
    window.addEventListener('keydown', handleActivity);

    const handleVisibilityChange = () => {
      if (!document.hidden) handleActivity();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (controlsLockedOpen) setReaderControlsIdle(false);
    else scheduleIdle();

    return () => {
      window.clearTimeout(idleTimer);
      passiveEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
      window.removeEventListener('keydown', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [controlsLockedOpen, setReaderControlsIdle]);

  useEffect(() => {
    const chapterNavigation = chapterNavigationRef.current;
    if (loading || !chapterNavigation) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        chapterNavigationVisibleRef.current = isVisible;
        setChapterNavigationVisible(isVisible);
        const h = document.documentElement;
        const scrollTop = h.scrollTop || document.body.scrollTop;
        const atEnd = isVisible || h.scrollHeight - (scrollTop + h.clientHeight) <= 96;
        if (readerAtEndRef.current !== atEnd) {
          readerAtEndRef.current = atEnd;
          setReaderAtEnd(atEnd);
        }
      },
      {
        root: null,
        rootMargin: '0px 0px -64px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(chapterNavigation);
    return () => observer.disconnect();
  }, [loading, bookId_, chapterNum_, setReaderAtEnd]);

  // Enriquece el texto copiado con la cita de origen y el enlace a la Biblia.
  useEffect(() => {
    if (!routeValid?.valid) return undefined;

    const getVerseNumber = (node) => {
      let el = node && node.nodeType === 3 ? node.parentElement : node;
      while (el && el !== document.body) {
        if (el.id && el.id.startsWith('verse-')) return Number(el.id.slice(6));
        el = el.parentElement;
      }
      return null;
    };

    const handleCopy = (e) => {
      const sel = window.getSelection();
      if (!sel) return;
      const selected = sel.toString().replace(/\s+/g, ' ').trim();
      if (!selected) return;

      const verses = [getVerseNumber(sel.anchorNode), getVerseNumber(sel.focusNode)]
        .filter((v) => Number.isInteger(v));
      if (verses.length === 0) return; // La selección no pertenece al lector.

      const vStart = Math.min(...verses);
      const vEnd = Math.max(...verses);
      const name = bibleBook?.name || getBookName(bookId_);
      const reference = buildVerseReference(name, chapterNum_, vStart, vEnd);
      const url = buildVerseShareUrl(bookId_, chapterNum_, vStart);

      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', buildCopyText({ reference, text: selected, url }));
        e.clipboardData.setData('text/html', buildCopyHtml({ reference, text: selected, url }));
        e.preventDefault();
      }
    };

    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, [routeValid, bookId_, chapterNum_, bibleBook]);

  const handlePrevChapter = useCallback(() => {
    if (chapterNum_ > 1) {
      navigate(`/read/${bookId_}/${chapterNum_ - 1}`);
      return;
    }
    if (bookId_ <= 1) return;

    const lastChapter = getBookChapterCount(bookId_ - 1) || 1;
    navigate(`/read/${bookId_ - 1}/${lastChapter}`);
  }, [bookId_, chapterNum_, navigate]);

  const handleNextChapter = useCallback(() => {
    const totalChapters = getBookChapterCount(bookId_) || bibleBook?.chapterCount || 0;
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

  const handleOpenMenu = useCallback((verseNum) => setMenuVerse(verseNum), []);
  const handleCloseMenu = useCallback(() => setMenuVerse(null), []);

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
            ref={progressRef}
            className={classes.progressBar}
            max={100}
            defaultValue={0}
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

            <nav
              ref={chapterNavigationRef}
              className={classes.navigation}
              aria-label="Navegación de capítulos"
            >
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
                disabled={bookId_ === getTotalBooks() && chapterNum_ === (getBookChapterCount(bookId_) || bibleBook?.chapterCount || 0)}
                className={classes.navBtn}
              >
                Siguiente
              </button>
            </nav>
          </main>

          <ReaderFAB
            key={`${bookId_}-${chapterNum_}`}
            hidden={readerControlsIdle || chapterNavigationVisible}
            onExpandedChange={setReaderSettingsOpen}
          />

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

          {showCba && (
            <Suspense fallback={null}>
              <CbaModal
                isOpen
                onClose={() => setShowCba(false)}
                bookId={bookId_}
                chapter={chapterNum_}
                verse={cbaVerse}
                bookName={bookName}
              />
            </Suspense>
          )}
        </>
      )}
    </div>
  );
}

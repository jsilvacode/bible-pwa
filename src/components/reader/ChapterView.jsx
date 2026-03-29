import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBible } from '../../hooks/useBible';
import { useRecentReads, useSettings } from '../../hooks/useSettings';
import { useBookmarks } from '../../hooks/useBookmarks';
import VerseBlock from './VerseBlock';
import VerseMenu from './VerseMenu';
import classes from './ChapterView.module.css';
import { fetchBooksManifest } from '../../services/bibleLoader';
import { useHighlights } from '../../hooks/useHighlights';

export default function ChapterView() {
  const { book, chapter, verse } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { addRecent } = useRecentReads();
  const { data, loading, error } = useBible(settings.version, book);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  
  const [selectedVerse, setSelectedVerse] = useState(verse ? Number(verse) : null);
  const [menuVerse, setMenuVerse] = useState(null);
  const [books, setBooks] = useState([]);
  
  const { highlights, setHighlight } = useHighlights(settings.version, book, chapter);
  
  const touchStartX = useRef(null);

  useEffect(() => {
    fetchBooksManifest().then(setBooks).catch(console.error);
  }, []);

  useEffect(() => {
    if (verse && !loading && data) {
      setTimeout(() => {
        const el = document.getElementById(`verse-${verse}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setSelectedVerse(Number(verse));
        }
      }, 100);
    }
  }, [verse, loading, data, chapter]);

  useEffect(() => {
    if (!loading && data && book && chapter) {
      addRecent(Number(book), Number(chapter));
    }
  }, [book, chapter, loading, data, addRecent]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 70) { 
      if (diff > 0) {
        handleNextChapter();
      } else {
        handlePrevChapter();
      }
    }
    touchStartX.current = null;
  };

  const currentBookIndex = books.findIndex(b => b.id === Number(book));

  const handleNextChapter = () => {
    if (!data) return;
    const chapNum = Number(chapter);
    if (chapNum < data.chapters.length) {
      navigate(`/read/${book}/${chapNum + 1}`);
    } else if (books.length > 0 && currentBookIndex < books.length - 1) {
      navigate(`/read/${books[currentBookIndex + 1].id}/1`);
    }
  };

  const handlePrevChapter = () => {
    if (!data) return;
    const chapNum = Number(chapter);
    if (chapNum > 1) {
      navigate(`/read/${book}/${chapNum - 1}`);
    } else if (books.length > 0 && currentBookIndex > 0) {
      const prevBook = books[currentBookIndex - 1];
      navigate(`/read/${prevBook.id}/${prevBook.chapters}`);
    }
  };

  const handleShortTap = (v) => {
    setSelectedVerse(selectedVerse === v ? null : v);
  };

  const handleLongTap = (v) => {
    setSelectedVerse(v);
    setMenuVerse(v);
  };

  const buildVersePayload = (verseNumber) => {
    if (!data) return null;
    const verseData = currentChapterData?.verses.find(v => v.verse === verseNumber);
    if (!verseData) return null;

    return {
      id: `${settings.version}-${book}-${chapter}-${verseNumber}`,
      version: settings.version,
      book: Number(book),
      bookName: data.name,
      chapter: Number(chapter),
      verse: verseNumber,
      text: verseData.text,
      onHighlight: (color) => {
        setHighlight({
          id: `${settings.version}-${book}-${chapter}-${verseNumber}`,
          version: settings.version,
          book: Number(book),
          chapter: Number(chapter),
          verse: verseNumber
        }, color);
      }
    };
  };

  const handleShareVerse = async (payload) => {
    if (!payload) return;

    const reference = `${payload.bookName || `Libro ${payload.book}`} ${payload.chapter}:${payload.verse}`;
    const cleanVerseText = String(payload.text || '').replace(/\s+/g, ' ').trim();
    const shareUrlObj = new URL(`${window.location.origin}/share/${payload.book}/${payload.chapter}/${payload.verse}`);
    shareUrlObj.searchParams.set('bookName', payload.bookName || `Libro ${payload.book}`);
    shareUrlObj.searchParams.set('text', cleanVerseText.slice(0, 200));
    const shareUrl = shareUrlObj.toString();
    const text = `${reference}\n\n${cleanVerseText}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: reference,
          text,
          url: shareUrl,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text}\n\n${shareUrl}`);
        alert('Versículo copiado. Puedes pegarlo en WhatsApp, correo o donde quieras.');
      } else {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`,
          '_blank',
          'noopener,noreferrer'
        );
      }
    } catch (e) {
      console.error('Error al compartir', e);
      alert('No fue posible compartir este versículo.');
    }
  };

  if (loading) return <div className={classes.loader}>Cargando...</div>;
  if (error) return <div className={classes.error}>Error: {error.message}</div>;

  const currentChapterData = data.chapters.find(c => c.chapter === Number(chapter));
  if (!currentChapterData) return <div className={classes.error}>Capítulo no encontrado</div>;
  const selectedPayload = selectedVerse ? buildVersePayload(selectedVerse) : null;
  const canGoPrev = Number(chapter) > 1 || (books.length > 0 && currentBookIndex > 0);
  const canGoNext = Number(chapter) < data.chapters.length || (books.length > 0 && currentBookIndex < books.length - 1);
  const selectedIsBookmarked = selectedPayload ? isBookmarked(selectedPayload.id) : false;

  return (
    <div 
      className={classes.readerContainer}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ fontSize: `var(--font-size-${settings.fontSize})` }}
    >
      <div className={classes.chapterHeader}>
        <button
          className={classes.chapterNavBtn}
          onClick={handlePrevChapter}
          disabled={!canGoPrev}
          aria-label="Capítulo anterior"
        >
          <span className={classes.chapterNavArrow}>←</span>
          <span className={classes.chapterNavText}>Anterior</span>
        </button>
        <div className={classes.bookTitle}>{data.name} {chapter}</div>
        <button
          className={classes.chapterNavBtn}
          onClick={handleNextChapter}
          disabled={!canGoNext}
          aria-label="Capítulo siguiente"
        >
          <span className={classes.chapterNavText}>Siguiente</span>
          <span className={classes.chapterNavArrow}>→</span>
        </button>
      </div>

      {selectedPayload && (
        <div className={classes.desktopVerseActions}>
          <span className={classes.desktopVerseLabel}>Versículo {selectedPayload.verse}</span>
          <button onClick={() => toggleBookmark(selectedPayload.id, selectedPayload)}>
            🔖 {selectedIsBookmarked ? 'Quitar Marcador' : 'Añadir Marcador'}
          </button>
          <button
            aria-label="Resaltar en amarillo"
            className={classes.desktopColorBtn}
            style={{ background: 'var(--highlight-yellow)' }}
            onClick={() => selectedPayload.onHighlight('yellow')}
          />
          <button
            aria-label="Resaltar en verde"
            className={classes.desktopColorBtn}
            style={{ background: 'var(--highlight-green)' }}
            onClick={() => selectedPayload.onHighlight('green')}
          />
          <button
            aria-label="Resaltar en azul"
            className={classes.desktopColorBtn}
            style={{ background: 'var(--highlight-blue)' }}
            onClick={() => selectedPayload.onHighlight('blue')}
          />
          <button
            aria-label="Resaltar en rosa"
            className={classes.desktopColorBtn}
            style={{ background: 'var(--highlight-pink)' }}
            onClick={() => selectedPayload.onHighlight('pink')}
          />
          <button onClick={() => selectedPayload.onHighlight(null)}>Limpiar color</button>
          <button onClick={() => handleShareVerse(selectedPayload)}>📤 Compartir</button>
        </div>
      )}
      {selectedPayload && (
        <div className={classes.compactToolsWrap}>
          <button
            className={classes.compactToolsBtn}
            onClick={() => setMenuVerse(selectedPayload.verse)}
          >
            Herramientas del versículo
          </button>
        </div>
      )}
      {!selectedPayload && (
        <div className={classes.desktopHint}>
          Selecciona un versículo para usar Marcador, Resaltar o Compartir.
        </div>
      )}

      <div className={classes.prose}>
        {currentChapterData.verses.map(v => (
          <VerseBlock
            key={v.verse}
            verse={v.verse}
            text={v.text}
            isSelected={selectedVerse === v.verse}
            isHighlighted={!!highlights[v.verse]} 
            highlightColor={highlights[v.verse]}
            onShortTap={handleShortTap}
            onLongTap={handleLongTap}
            onOpenMenu={handleLongTap}
          />
        ))}
      </div>
      
      {menuVerse && (
        <VerseMenu 
          verse={menuVerse} 
          payload={buildVersePayload(menuVerse)}
          onClose={() => setMenuVerse(null)} 
        />
      )}
    </div>
  );
}

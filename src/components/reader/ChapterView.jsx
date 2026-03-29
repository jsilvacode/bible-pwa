import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBible } from '../../hooks/useBible';
import { useRecentReads, useSettings } from '../../hooks/useSettings';
import VerseBlock from './VerseBlock';
import VerseMenu from './VerseMenu';
import CommentaryPopup from './CommentaryPopup';
import classes from './ChapterView.module.css';
import { fetchBooksManifest } from '../../services/bibleLoader';
import { useHighlights } from '../../hooks/useHighlights';

export default function ChapterView() {
  const { book, chapter, verse } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { addRecent } = useRecentReads();
  const { data, loading, error } = useBible(settings.version, book);
  
  const [selectedVerse, setSelectedVerse] = useState(verse ? Number(verse) : null);
  const [menuVerse, setMenuVerse] = useState(null);
  const [showCommentary, setShowCommentary] = useState(null);
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
    if (!data || books.length === 0) return;
    const chapNum = Number(chapter);
    if (chapNum < data.chapters.length) {
      navigate(`/read/${book}/${chapNum + 1}`);
    } else if (currentBookIndex < books.length - 1) {
      navigate(`/read/${books[currentBookIndex + 1].id}/1`);
    }
  };

  const handlePrevChapter = () => {
    if (!data || books.length === 0) return;
    const chapNum = Number(chapter);
    if (chapNum > 1) {
      navigate(`/read/${book}/${chapNum - 1}`);
    } else if (currentBookIndex > 0) {
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

  if (loading) return <div className={classes.loader}>Cargando...</div>;
  if (error) return <div className={classes.error}>Error: {error.message}</div>;

  const currentChapterData = data.chapters.find(c => c.chapter === Number(chapter));
  if (!currentChapterData) return <div className={classes.error}>Capítulo no encontrado</div>;

  return (
    <div 
      className={classes.readerContainer}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ fontSize: `var(--font-size-${settings.fontSize})` }}
    >
      <div className={classes.bookTitle}>{data.name} {chapter}</div>
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
          />
        ))}
      </div>
      
      {menuVerse && (
        <VerseMenu 
          verse={menuVerse} 
          payload={{
            id: `${settings.version}-${book}-${chapter}-${menuVerse}`,
            version: settings.version,
            book: Number(book),
            chapter: Number(chapter),
            verse: menuVerse,
            text: currentChapterData.verses.find(v => v.verse === menuVerse)?.text,
            onHighlight: (color) => {
              setHighlight({
                id: `${settings.version}-${book}-${chapter}-${menuVerse}`,
                version: settings.version,
                book: Number(book),
                chapter: Number(chapter),
                verse: menuVerse
              }, color);
            }
          }}
          onShowCommentary={setShowCommentary}
          onClose={() => setMenuVerse(null)} 
        />
      )}

      {showCommentary && (
        <CommentaryPopup 
          verseData={{ book: Number(book), chapter: Number(chapter) }}
          verse={showCommentary}
          onClose={() => setShowCommentary(null)}
        />
      )}
    </div>
  );
}

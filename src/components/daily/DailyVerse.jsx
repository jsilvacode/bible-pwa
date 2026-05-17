import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { loadBibleBook } from '../../services/bibleLoader';
import { loadCbaVerse } from '../../services/cbaLoader';
import { shareVerse } from '../../utils/shareVerse';
import classes from './DailyVerse.module.css';

const DAILY_VERSES = [
  { book: 1, chapter: 1, verse: 1 },
  { book: 6, chapter: 1, verse: 9 },
  { book: 19, chapter: 23, verse: 1 },
  { book: 20, chapter: 3, verse: 5 },
  { book: 23, chapter: 41, verse: 10 },
  { book: 43, chapter: 3, verse: 16 },
  { book: 62, chapter: 4, verse: 8 },
];

export default function DailyVerse({ variant = 'hero' }) {
  const { settings } = useSettings();
  const [verseText, setVerseText] = useState('');
  const [cbaQuote, setCbaQuote] = useState('');
  const [reference, setReference] = useState('');
  const navigate = useNavigate();

  const dailyRef = useMemo(() => {
    const now = new Date();
    const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    const idx = seed % DAILY_VERSES.length;
    return DAILY_VERSES[idx];
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadContent() {
      try {
        const [bookData, quote] = await Promise.all([
          loadBibleBook(settings.version, dailyRef.book, { signal: controller.signal }),
          loadCbaVerse(dailyRef.book, dailyRef.chapter, dailyRef.verse, {
            signal: controller.signal,
          }),
        ]);

        const chapter = bookData?.chapters?.find((c) => c.chapter === dailyRef.chapter);
        const verse = chapter?.verses?.find((v) => v.verse === dailyRef.verse);
        if (bookData?.name) {
          setReference(`${bookData.name} ${dailyRef.chapter}:${dailyRef.verse}`);
        }
        if (verse?.text) {
          setVerseText(verse.text);
        }
        if (quote) {
          setCbaQuote(quote);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error loading daily verse', err);
        }
      }
    }

    loadContent();
    return () => controller.abort();
  }, [settings.version, dailyRef]);

  const handleShare = async (e) => {
    e.stopPropagation();
    const refLabel = reference || `Libro ${dailyRef.book} ${dailyRef.chapter}:${dailyRef.verse}`;
    const text = verseText ? `"${verseText}" — ${refLabel}` : refLabel;
    const url = `${window.location.origin}/read/${dailyRef.book}/${dailyRef.chapter}/${dailyRef.verse}`;

    try {
      const result = await shareVerse({ title: 'Versículo del Día', text, url });
      if (result === 'copied') {
        alert('Copiado al portapapeles');
      }
    } catch (err) {
      console.error('Error sharing', err);
    }
  };

  const isHero = variant === 'hero';
  const cbaPreview = cbaQuote
    ? (cbaQuote.split('\n\n')[0].length > 350
        ? `${cbaQuote.split('\n\n')[0].substring(0, 350)}...`
        : cbaQuote.split('\n\n')[0])
    : '';

  return (
    <div className={`${classes.container} ${isHero ? classes.hero : classes.compact}`}>
      <div className={classes.content}>
        <div
          className={classes.clickableArea}
          onClick={() => navigate(`/read/${dailyRef.book}/${dailyRef.chapter}/${dailyRef.verse}`)}
        >
          <div className={classes.header}>
            <span className={classes.tag}>VERSÍCULO DEL DÍA</span>
            <h2 className={classes.reference}>
              {reference || `Libro ${dailyRef.book} ${dailyRef.chapter}:${dailyRef.verse}`}
            </h2>
          </div>

          <p className={classes.verseText}>
            {verseText ? `"${verseText}"` : 'Cargando versículo...'}
          </p>
        </div>

        {isHero && cbaPreview && (
          <div className={classes.cbaQuote}>
            <p className={classes.cbaLabel}>COMENTARIO BÍBLICO ADVENTISTA:</p>
            <p className={classes.cbaContent}>{cbaPreview}</p>
            <span
              className={classes.readMore}
              onClick={(e) => {
                e.stopPropagation();
                navigate(
                  `/read/${dailyRef.book}/${dailyRef.chapter}/${dailyRef.verse}?showCba=true`
                );
              }}
            >
              Leer más
            </span>
          </div>
        )}

        <div className={classes.actions}>
          <button type="button" className={classes.actionBtn} onClick={handleShare}>
            Compartir
          </button>
          <button
            type="button"
            className={classes.readBtn}
            onClick={() => navigate(`/read/${dailyRef.book}/${dailyRef.chapter}`)}
          >
            Leer capítulo completo
          </button>
        </div>
      </div>
    </div>
  );
}

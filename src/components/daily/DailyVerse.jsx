import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useToast } from '../../hooks/useToast';
import { loadBibleChapter } from '../../services/bibleLoader';
import { shareVerse } from '../../utils/shareVerse';
import { buildVerseShareUrl } from '../../utils/verseCopy';
import { normalizeDisplayedText } from '../../utils/textNormalizer';
import { getDailyTheme } from '../../data/dailyThemes';
import classes from './DailyVerse.module.css';

export default function DailyVerse({ variant = 'hero', children }) {
  const { settings } = useSettings();
  const { showToast } = useToast();
  const [verseText, setVerseText] = useState('');
  const [reference, setReference] = useState('');
  const navigate = useNavigate();

  const dailyTheme = useMemo(() => getDailyTheme(), []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadContent() {
      try {
        setVerseText('');
        setReference('');

        const bookData = await loadBibleChapter(settings.version, dailyTheme.book, dailyTheme.chapter, {
          signal: controller.signal,
        });

        const chapter = bookData?.chapters?.find((c) => c.chapter === dailyTheme.chapter);
        const verse = chapter?.verses?.find((v) => v.verse === dailyTheme.verse);
        if (bookData?.name) {
          setReference(`${bookData.name} ${dailyTheme.chapter}:${dailyTheme.verse}`);
        }
        if (verse?.text) {
          setVerseText(normalizeDisplayedText(verse.text));
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error loading daily verse', err);
        }
      }
    }

    loadContent();
    return () => controller.abort();
  }, [settings.version, dailyTheme]);

  const handleShare = async (e) => {
    e.stopPropagation();
    const refLabel = reference || `Libro ${dailyTheme.book} ${dailyTheme.chapter}:${dailyTheme.verse}`;
    const text = verseText ? `"${verseText}" — ${refLabel}` : refLabel;
    const url = buildVerseShareUrl(dailyTheme.book, dailyTheme.chapter, dailyTheme.verse);

    try {
      const result = await shareVerse({ title: 'Una palabra para hoy', text, url });
      if (result === 'copied') {
        showToast('Copiado al portapapeles');
      }
    } catch (err) {
      console.error('Error sharing', err);
    }
  };

  const isHero = variant === 'hero';

  return (
    <div className={`${classes.container} ${isHero ? classes.hero : classes.compact}`}>
      <div className={classes.content}>
        <div
          className={classes.clickableArea}
          onClick={() => navigate(`/read/${dailyTheme.book}/${dailyTheme.chapter}/${dailyTheme.verse}`)}
        >
          <div className={classes.header}>
            <span className={classes.tag}>UNA PALABRA PARA HOY</span>
            <p className={classes.themePrompt}>{dailyTheme.prompt}</p>
            <h2 className={classes.reference}>
              <span className={classes.readPrompt}>Lee</span>{' '}
              {reference || `Libro ${dailyTheme.book} ${dailyTheme.chapter}:${dailyTheme.verse}`}
            </h2>
          </div>

          <p className={classes.verseText}>
            {verseText ? `"${verseText}"` : 'Cargando versículo...'}
          </p>
        </div>

        <div className={classes.actions}>
          <button type="button" className={classes.actionBtn} onClick={handleShare}>
            Compartir
          </button>
          <button
            type="button"
            className={classes.readBtn}
            onClick={() => navigate(`/read/${dailyTheme.book}/${dailyTheme.chapter}`)}
          >
            Leer capítulo completo
          </button>
        </div>

        {isHero && children && (
          <div className={classes.heroExtension}>{children}</div>
        )}
      </div>
    </div>
  );
}

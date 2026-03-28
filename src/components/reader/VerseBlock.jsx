import React, { useRef } from 'react';
import classes from './ChapterView.module.css';

export default function VerseBlock({ verse, text, isSelected, isHighlighted, highlightColor, onShortTap, onLongTap }) {
  const timerRef = useRef(null);
  const touchStartRef = useRef(0);

  const handleTouchStart = () => {
    touchStartRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onLongTap(verse);
      timerRef.current = null;
    }, 500);
  };

  const handleTouchEnd = (e) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      // Era un tap corto
      const duration = Date.now() - touchStartRef.current;
      if (duration < 500) {
        onShortTap(verse);
      }
    }
  };

  const handleTouchMove = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <span 
      className={`${classes.verseBlock} ${isSelected ? classes.selected : ''}`}
      style={isHighlighted && highlightColor ? { backgroundColor: `var(--highlight-${highlightColor})` } : {}}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onClick={() => onShortTap(verse)} 
      id={`verse-${verse}`}
    >
      <sup className={classes.verseNum}>{verse}</sup>
      {text}{' '}
    </span>
  );
}

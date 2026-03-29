import React, { useRef } from 'react';
import classes from './ChapterView.module.css';

export default function VerseBlock({ verse, text, isSelected, isHighlighted, highlightColor, onShortTap, onLongTap }) {
  const timerRef = useRef(null);
  const touchStartRef = useRef(0);
  const didTouchRef = useRef(false);

  const handleTouchStart = () => {
    touchStartRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onLongTap(verse);
      timerRef.current = null;
    }, 500);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      // Era un tap corto
      const duration = Date.now() - touchStartRef.current;
      if (duration < 500) {
        didTouchRef.current = true;
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

  const handleClick = () => {
    if (didTouchRef.current) {
      didTouchRef.current = false;
      return;
    }
    onShortTap(verse);
  };

  return (
    <span 
      className={`${classes.verseBlock} ${isSelected ? classes.selected : ''}`}
      style={isHighlighted && highlightColor ? { backgroundColor: `var(--highlight-${highlightColor})` } : {}}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onClick={handleClick}
      id={`verse-${verse}`}
    >
      <sup className={classes.verseNum}>{verse}</sup>
      {text}{' '}
    </span>
  );
}

import React from 'react';
import classes from './ChapterView.module.css';
import { normalizeDisplayedText } from '../../utils/textNormalizer';

function hasActiveSelection() {
  const sel = typeof window !== 'undefined' ? window.getSelection() : null;
  return !!sel && sel.toString().trim().length > 0;
}

export default function VerseBlock({
  verse,
  text,
  isSelected,
  isHighlighted,
  highlightColor,
  onShortTap,
  onOpenMenu,
  isTarget,
}) {
  const handleClick = () => {
    // Si el usuario está seleccionando texto, no abrir el menú.
    if (hasActiveSelection()) return;
    onShortTap(verse);
  };

  const handleDoubleClick = () => {
    if (onOpenMenu) onOpenMenu(verse);
  };

  const handleContextMenu = (e) => {
    // Con texto seleccionado, dejar el menú nativo de copiar del sistema.
    if (hasActiveSelection()) return;
    if (!onOpenMenu) return;
    e.preventDefault();
    onOpenMenu(verse);
  };

  return (
    <span
      className={`${classes.verseBlock} ${isSelected ? classes.selected : ''} ${isTarget ? classes.targetBlink : ''} ${isHighlighted && highlightColor ? classes[`highlight${highlightColor.charAt(0).toUpperCase()}${highlightColor.slice(1)}`] : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      title="Toca para acciones · mantén presionado para seleccionar y copiar"
      id={`verse-${verse}`}
    >
      <sup className={classes.verseNum}>{verse}</sup>
      {normalizeDisplayedText(text)}{' '}
    </span>
  );
}

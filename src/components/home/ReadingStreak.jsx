import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconChevronDown, IconChevronRight, IconFlame } from '../ui/Icons';
import classes from './ReadingStreak.module.css';
import { useSettings } from '../../hooks/useSettings';
import { useCompactLayout } from '../../hooks/useCompactLayout';

export default function ReadingStreak() {
  const navigate = useNavigate();
  const [weekOpen, setWeekOpen] = useState(false);
  const isCompactLayout = useCompactLayout();
  const {
    settings,
    weeklyStreak,
    currentStreak,
    bestStreak,
    daysReadThisWeek,
    hasReadToday,
  } = useSettings();
  const streakLabel = currentStreak === 1 ? 'día de racha' : 'días de racha';
  const statusMessage = hasReadToday
    ? 'Racha asegurada por hoy. Puedes volver cuando quieras.'
    : currentStreak > 0
      ? 'Lee hoy, aunque sea unos minutos, para mantenerla.'
      : 'Una lectura breve hoy puede ser el comienzo de tu racha.';
  const targetBook = settings.lastRead?.book || 1;
  const targetChapter = settings.lastRead?.chapter || 1;
  const showWeek = !isCompactLayout || weekOpen;

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <div className={classes.headingCopy}>
          <h2 className={classes.title}>Tu ritmo de lectura</h2>
          <p className={classes.subtitle}>Cada día que vuelves, tu camino sigue creciendo.</p>
        </div>
        <div className={classes.streakMetric} aria-label={`${currentStreak} ${streakLabel}`}>
          <IconFlame size={22} aria-hidden="true" />
          <strong>{currentStreak}</strong>
          <span>{streakLabel}</span>
        </div>
      </div>

      <div className={classes.stats} aria-label="Resumen de lectura">
        <div className={classes.stat}>
          <strong>{daysReadThisWeek}/7</strong>
          <span>Esta semana</span>
        </div>
        <div className={classes.statDivider} aria-hidden="true" />
        <div className={classes.stat}>
          <strong>{bestStreak}</strong>
          <span>Mejor racha</span>
        </div>
      </div>

      {isCompactLayout && (
        <button
          type="button"
          className={`${classes.weekToggle} ${weekOpen ? classes.weekToggleOpen : ''}`}
          aria-expanded={weekOpen}
          aria-controls="weekly-reading-activity"
          onClick={() => setWeekOpen((open) => !open)}
        >
          <span>Actividad semanal</span>
          <span className={classes.weekToggleMeta}>
            {daysReadThisWeek}/7
            <IconChevronDown size={16} aria-hidden="true" />
          </span>
        </button>
      )}

      {showWeek && (
        <div id="weekly-reading-activity" className={classes.week} aria-label="Actividad de los últimos siete días">
          {weeklyStreak.map((day) => (
            <div
              key={day.date}
              className={`${classes.day} ${day.isRead ? classes.dayRead : ''} ${day.isToday ? classes.dayToday : ''}`}
              title={`${day.dayName} ${day.dayNumber}: ${day.isRead ? `${day.count} ${day.count === 1 ? 'capítulo' : 'capítulos'}` : 'sin lectura'}`}
            >
              <span className={classes.dayName}>{day.dayName}</span>
              <span className={classes.dayNumber}>{day.dayNumber}</span>
              <span className={classes.dayState} aria-hidden="true">{day.isRead ? '✓' : '·'}</span>
              <span className={classes.srOnly}>
                {day.isRead ? `${day.count} ${day.count === 1 ? 'capítulo leído' : 'capítulos leídos'}` : 'Sin lectura'}
                {day.isToday ? ', hoy' : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={classes.status}>
        <span className={`${classes.statusIcon} ${hasReadToday ? classes.statusComplete : ''}`} aria-hidden="true">
          {hasReadToday ? '✓' : '○'}
        </span>
        <p>{statusMessage}</p>
        <button
          type="button"
          className={classes.action}
          aria-label={`${hasReadToday ? 'Continuar' : 'Leer ahora'} con mi lectura`}
          onClick={() => navigate(`/read/${targetBook}/${targetChapter}`)}
        >
          {hasReadToday ? 'Continuar' : 'Leer ahora'}
          <IconChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}

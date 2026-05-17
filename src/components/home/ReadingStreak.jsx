import React from 'react';
import classes from './ReadingStreak.module.css';
import { useSettings } from '../../hooks/useSettings';

export default function ReadingStreak() {
  const { weeklyStreak } = useSettings();
  const maxCount = Math.max(...weeklyStreak.map(d => d.count), 1);
  const getBarLevelClass = (count) => {
    const ratio = maxCount === 0 ? 0 : count / maxCount;
    const bucket = Math.max(0, Math.min(10, Math.round(ratio * 10)));
    return classes[`level${bucket}`] || classes.level0;
  };

  return (
    <div className={classes.container}>
      <h3 className={classes.title}>Actividad de Lectura</h3>
      <div className={classes.chart}>
        {weeklyStreak.map((day) => (
          <div key={day.date} className={classes.barWrapper}>
            <div 
              className={`${classes.bar} ${getBarLevelClass(day.count)}`}
              title={`${day.count} capítulos`}
            >
              {day.count > 0 && <span className={classes.count}>{day.count}</span>}
            </div>
            <span className={classes.dayLabel}>{day.dayName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

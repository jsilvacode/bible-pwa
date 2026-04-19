import React from 'react';
import classes from './ReadingStreak.module.css';
import { useSettings } from '../../hooks/useSettings';

export default function ReadingStreak() {
  const { weeklyStreak } = useSettings();
  const maxCount = Math.max(...weeklyStreak.map(d => d.count), 1);

  return (
    <div className={classes.container}>
      <h3 className={classes.title}>Actividad de Lectura</h3>
      <div className={classes.chart}>
        {weeklyStreak.map((day, i) => (
          <div key={day.date} className={classes.barWrapper}>
            <div 
              className={classes.bar} 
              style={{ 
                height: `${(day.count / maxCount) * 100}%`,
                animationDelay: `${i * 0.1}s`
              }}
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

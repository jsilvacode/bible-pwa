import React from 'react';
import classes from './SkeletonChapter.module.css';

export default function SkeletonChapter() {
  return (
    <div className={classes.container}>
      <div className={`${classes.title} skeleton`} />
      <div className={classes.content}>
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className={classes.lineGroup}>
            <div className={`${classes.line} ${classes.lineWide} skeleton`} />
            <div className={`${classes.line} ${classes.lineNarrow} skeleton`} />
          </div>
        ))}
      </div>
    </div>
  );
}

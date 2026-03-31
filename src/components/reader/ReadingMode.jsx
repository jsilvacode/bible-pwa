import React from 'react';
import classes from './ChapterView.module.css';

export default function ReadingMode({ children }) {
  return <div className={`${classes.prose} ${classes.reading} readingText`}>{children}</div>;
}

import React from 'react';
import classes from './EditorialPage.module.css';

export function EditorialPage({ eyebrow, title, description, children, className = '' }) {
  return (
    <div className={`${classes.page} ${className}`}>
      <header className={classes.header}>
        {eyebrow && <span className={classes.eyebrow}>{eyebrow}</span>}
        <h1 className={classes.title}>{title}</h1>
        {description && <p className={classes.description}>{description}</p>}
      </header>
      {children}
    </div>
  );
}

export function EditorialPanel({ children, className = '', as: Tag = 'div' }) {
  return <Tag className={`${classes.panel} ${className}`}>{children}</Tag>;
}

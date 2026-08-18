import React from 'react';
import ChapterView from './ChapterView';
import { BookmarksProvider } from '../../hooks/useBookmarks';

// Saved verses are a reader-only concern. Keeping them in this route leaves
// the home screen free from their IndexedDB reads on startup.
export default function ReaderRoute() {
  return (
    <BookmarksProvider>
      <ChapterView />
    </BookmarksProvider>
  );
}

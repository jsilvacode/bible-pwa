import React from 'react';
import BookmarksView from './BookmarksView';
import { BookmarksProvider } from '../../hooks/useBookmarks';

// IndexedDB is only needed once the user enters their saved verses.
export default function BookmarksRoute() {
  return (
    <BookmarksProvider>
      <BookmarksView />
    </BookmarksProvider>
  );
}

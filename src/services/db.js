import { createStore } from 'idb-keyval';

const legacyDbName = 'bible_user_data';

// Cada colección usa su propia base: idb-keyval no puede añadir dos object stores
// a una misma base sin gestionar explícitamente una migración de versión.
export const bookmarksStore = createStore('bible_bookmarks_data', 'bookmarks');
export const highlightsStore = createStore('bible_highlights_data', 'highlights');

// Lectura defensiva para conservar datos de instalaciones anteriores.
export const legacyBookmarksStore = createStore(legacyDbName, 'bookmarks');
export const legacyHighlightsStore = createStore(legacyDbName, 'highlights');

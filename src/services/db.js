import { createStore } from 'idb-keyval';

export const dbName = 'bible_user_data';

// Inicializar IndexedDB con los stores requeridos
export const bookmarksStore = createStore(dbName, 'bookmarks');
export const highlightsStore = createStore(dbName, 'highlights');

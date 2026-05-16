import { createStore } from 'idb-keyval';

const dbName = 'bible_user_data';

export const bookmarksStore = createStore(dbName, 'bookmarks');
export const highlightsStore = createStore(dbName, 'highlights');

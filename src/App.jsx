import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';

import HomeScreen from './components/home/HomeScreen';
import SearchView from './components/search/SearchView';
import BookmarksView from './components/bookmarks/BookmarksView';
import SettingsView from './components/settings/SettingsView';
import ChapterView from './components/reader/ChapterView';
import AuthCallback from './components/auth/AuthCallback';
import { SettingsProvider } from './hooks/useSettings';

function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<HomeScreen />} />
            <Route path="read/:book/:chapter/:verse?" element={<ChapterView />} />
            <Route path="search" element={<SearchView />} />
            <Route path="bookmarks" element={<BookmarksView />} />
            <Route path="settings" element={<SettingsView />} />
            <Route path="callback" element={<AuthCallback />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  );
}

export default App;

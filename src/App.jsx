import React, { lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';

import HomeScreen from './components/home/HomeScreen';
import { SettingsProvider } from './hooks/useSettings';
import { BookmarksProvider } from './hooks/useBookmarks';
import { HighlightsProvider } from './hooks/useHighlights';
import { ToastProvider } from './hooks/useToast';
import { InstallPromptProvider } from './hooks/useInstallPrompt';
import { ReadingModeProvider } from './hooks/useReadingMode';
import { GlobalSearchProvider } from './hooks/useGlobalSearch';

const BibleBrowser = lazy(() => import('./components/bible/BibleBrowser'));
const BookmarksView = lazy(() => import('./components/bookmarks/BookmarksView'));
const SettingsView = lazy(() => import('./components/settings/SettingsView'));
const ChapterView = lazy(() => import('./components/reader/ChapterView'));

function App() {
  return (
    <SettingsProvider>
      <BookmarksProvider>
        <HighlightsProvider>
          <ToastProvider>
            <InstallPromptProvider>
              <ReadingModeProvider>
                <BrowserRouter>
                  <GlobalSearchProvider>
                    <Routes>
                      <Route path="/" element={<AppShell />}>
                        <Route index element={<HomeScreen />} />
                        <Route path="bible" element={<BibleBrowser />} />
                        <Route path="read/:book/:chapter/:verse?" element={<ChapterView />} />
                        <Route path="search" element={<Navigate to="/" replace />} />
                        <Route path="bookmarks" element={<BookmarksView />} />
                        <Route path="settings" element={<SettingsView />} />
                      </Route>
                    </Routes>
                  </GlobalSearchProvider>
                </BrowserRouter>
              </ReadingModeProvider>
            </InstallPromptProvider>
          </ToastProvider>
        </HighlightsProvider>
      </BookmarksProvider>
    </SettingsProvider>
  );
}

export default App;

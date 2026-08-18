import React, { lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import AppShell from './components/layout/AppShell';

import HomeScreen from './components/home/HomeScreen';
import { SettingsProvider } from './hooks/useSettings';
import { ToastProvider } from './hooks/useToast';
import { InstallPromptProvider } from './hooks/useInstallPrompt';
import { OfflineLibraryProvider } from './hooks/useOfflineLibrary';
import { ReadingModeProvider } from './hooks/useReadingMode';
import { GlobalSearchProvider } from './hooks/useGlobalSearch';

const BibleBrowser = lazy(() => import('./components/bible/BibleBrowser'));
const BookmarksRoute = lazy(() => import('./components/bookmarks/BookmarksRoute'));
const SettingsView = lazy(() => import('./components/settings/SettingsView'));
const ReaderRoute = lazy(() => import('./components/reader/ReaderRoute'));

function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
        <InstallPromptProvider>
          <OfflineLibraryProvider>
            <ReadingModeProvider>
              <BrowserRouter>
                <GlobalSearchProvider>
                  <Routes>
                    <Route path="/" element={<AppShell />}>
                      <Route index element={<HomeScreen />} />
                      <Route path="bible" element={<BibleBrowser />} />
                      <Route path="read/:book/:chapter/:verse?" element={<ReaderRoute />} />
                      <Route path="search" element={<Navigate to="/" replace />} />
                      <Route path="bookmarks" element={<BookmarksRoute />} />
                      <Route path="settings" element={<SettingsView />} />
                    </Route>
                  </Routes>
                  <Analytics />
                  <SpeedInsights />
                </GlobalSearchProvider>
              </BrowserRouter>
            </ReadingModeProvider>
          </OfflineLibraryProvider>
        </InstallPromptProvider>
      </ToastProvider>
    </SettingsProvider>
  );
}

export default App;

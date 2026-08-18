import React, { lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';

import HomeScreen from './components/home/HomeScreen';
import { SettingsProvider } from './hooks/useSettings';
import { ToastProvider } from './hooks/useToast';
import { InstallPromptProvider } from './hooks/useInstallPrompt';
import { ReadingModeProvider } from './hooks/useReadingMode';
import { GlobalSearchProvider } from './hooks/useGlobalSearch';
import DeferredTelemetry from './components/telemetry/DeferredTelemetry';

const BibleBrowser = lazy(() => import('./components/bible/BibleBrowser'));
const BookmarksRoute = lazy(() => import('./components/bookmarks/BookmarksRoute'));
const SettingsView = lazy(() => import('./components/settings/SettingsView'));
const ReaderRoute = lazy(() => import('./components/reader/ReaderRoute'));

function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
        <InstallPromptProvider>
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
                <DeferredTelemetry />
              </GlobalSearchProvider>
            </BrowserRouter>
          </ReadingModeProvider>
        </InstallPromptProvider>
      </ToastProvider>
    </SettingsProvider>
  );
}

export default App;

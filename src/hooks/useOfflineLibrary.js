import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useInstallPrompt } from './useInstallPrompt';
import { useSettings } from './useSettings';
import {
  prepareBibleVersion,
  prepareCommentary,
  requestPersistentStorage,
  supportsOfflineLibrary,
} from '../services/offlineLibrary';

const OfflineLibraryContext = createContext(null);

const idleState = { status: 'idle', progress: 0 };
const activeTasks = new Map();

export function OfflineLibraryProvider({ children }) {
  const { isInstalled } = useInstallPrompt();
  const { settings } = useSettings();
  const [versions, setVersions] = useState({});
  const [commentary, setCommentary] = useState(idleState);

  const prepareVersion = useCallback((version) => {
    if (!isInstalled || !supportsOfflineLibrary()) {
      return Promise.resolve({ status: 'unavailable' });
    }

    const taskKey = `bible:${version}`;
    if (activeTasks.has(taskKey)) return activeTasks.get(taskKey);

    let lastPaint = 0;
    setVersions((current) => ({
      ...current,
      [version]: { status: 'downloading', progress: current[version]?.progress ?? 0 },
    }));

    const task = prepareBibleVersion(version, {
      onProgress: ({ progress }) => {
        const now = Date.now();
        if (progress < 100 && now - lastPaint < 120) return;
        lastPaint = now;
        setVersions((current) => ({
          ...current,
          [version]: { status: 'downloading', progress },
        }));
      },
    })
      .then(() => {
        setVersions((current) => ({
          ...current,
          [version]: { status: 'ready', progress: 100 },
        }));
        return { status: 'ready' };
      })
      .catch((error) => {
        setVersions((current) => ({
          ...current,
          [version]: { status: 'error', progress: current[version]?.progress ?? 0 },
        }));
        throw error;
      })
      .finally(() => activeTasks.delete(taskKey));

    activeTasks.set(taskKey, task);
    return task;
  }, [isInstalled]);

  const prepareEditorialCommentary = useCallback(() => {
    if (!isInstalled || !supportsOfflineLibrary()) {
      return Promise.resolve({ status: 'unavailable' });
    }

    const taskKey = 'commentary';
    if (activeTasks.has(taskKey)) return activeTasks.get(taskKey);

    let lastPaint = 0;
    setCommentary((current) => ({ status: 'downloading', progress: current.progress ?? 0 }));

    const task = prepareCommentary({
      onProgress: ({ progress }) => {
        const now = Date.now();
        if (progress < 100 && now - lastPaint < 120) return;
        lastPaint = now;
        setCommentary({ status: 'downloading', progress });
      },
    })
      .then(() => {
        setCommentary({ status: 'ready', progress: 100 });
        return { status: 'ready' };
      })
      .catch((error) => {
        setCommentary((current) => ({ status: 'error', progress: current.progress ?? 0 }));
        throw error;
      })
      .finally(() => activeTasks.delete(taskKey));

    activeTasks.set(taskKey, task);
    return task;
  }, [isInstalled]);

  useEffect(() => {
    if (!isInstalled || !supportsOfflineLibrary()) return undefined;

    let cancelled = false;
    const beginPreparation = () => {
      requestPersistentStorage().catch(() => {});

      prepareVersion(settings.version)
        .then(() => (cancelled ? null : prepareEditorialCommentary()))
        .catch(() => {
          // A transient connection issue simply resumes on the next app visit.
        });
    };

    const resumePreparation = () => beginPreparation();

    const idleId = typeof window.requestIdleCallback === 'function'
      ? window.requestIdleCallback(beginPreparation, { timeout: 1800 })
      : null;
    const timeoutId = idleId === null
      ? window.setTimeout(beginPreparation, 700)
      : null;
    window.addEventListener('online', resumePreparation);

    return () => {
      cancelled = true;
      window.removeEventListener('online', resumePreparation);
      if (idleId !== null) window.cancelIdleCallback(idleId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [isInstalled, prepareEditorialCommentary, prepareVersion, settings.version]);

  const value = useMemo(() => ({
    isInstalled,
    supported: supportsOfflineLibrary(),
    prepareVersion,
    prepareCommentary: prepareEditorialCommentary,
    getVersionState: (version) => versions[version] ?? idleState,
    commentary,
  }), [commentary, isInstalled, prepareEditorialCommentary, prepareVersion, versions]);

  return createElement(OfflineLibraryContext.Provider, { value }, children);
}

export function useOfflineLibrary() {
  const context = useContext(OfflineLibraryContext);
  if (!context) {
    throw new Error('useOfflineLibrary must be used within an OfflineLibraryProvider');
  }
  return context;
}

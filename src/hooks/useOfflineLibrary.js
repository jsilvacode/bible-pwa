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
const BACKGROUND_START_DELAY = 3500;

function scheduleWhenQuiet(callback) {
  let delayId = null;
  let idleId = null;
  let cancelled = false;
  let started = false;
  const activityEvents = ['pointerdown', 'keydown', 'touchstart'];

  const clearPending = () => {
    if (delayId !== null) window.clearTimeout(delayId);
    if (idleId !== null) {
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    }
    delayId = null;
    idleId = null;
  };

  const removeActivityListeners = () => {
    activityEvents.forEach((eventName) => window.removeEventListener(eventName, postpone));
    document.removeEventListener('visibilitychange', resume);
  };

  const schedule = () => {
    clearPending();
    if (cancelled || started || document.hidden) return;

    delayId = window.setTimeout(() => {
      if (cancelled || document.hidden) return;

      const run = () => {
        idleId = null;
        if (cancelled || started || document.hidden) return;
        started = true;
        removeActivityListeners();
        callback();
      };

      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(run, { timeout: 6000 });
      } else {
        idleId = window.setTimeout(run, 0);
      }
    }, BACKGROUND_START_DELAY);
  };

  const postpone = () => schedule();
  const resume = () => {
    if (!document.hidden) schedule();
  };

  activityEvents.forEach((eventName) => window.addEventListener(eventName, postpone, { passive: true }));
  document.addEventListener('visibilitychange', resume);
  schedule();

  return () => {
    cancelled = true;
    clearPending();
    removeActivityListeners();
  };
}

export function OfflineLibraryProvider({ children }) {
  const { isInstalled } = useInstallPrompt();
  const { settings } = useSettings();
  const [versions, setVersions] = useState({});
  const [commentary, setCommentary] = useState(idleState);

  const prepareVersion = useCallback((version, { background = false } = {}) => {
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
      background,
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

  const prepareEditorialCommentary = useCallback(({ background = false } = {}) => {
    if (!isInstalled || !supportsOfflineLibrary()) {
      return Promise.resolve({ status: 'unavailable' });
    }

    const taskKey = 'commentary';
    if (activeTasks.has(taskKey)) return activeTasks.get(taskKey);

    let lastPaint = 0;
    setCommentary((current) => ({ status: 'downloading', progress: current.progress ?? 0 }));

    const task = prepareCommentary({
      background,
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
    const beginBiblePreparation = () => {
      requestPersistentStorage().catch(() => {});

      prepareVersion(settings.version, { background: true })
        .then(() => {
          if (cancelled) return;
          cancelCommentaryPreparation = scheduleWhenQuiet(() => {
            prepareEditorialCommentary({ background: true }).catch(() => {
              // A transient connection issue simply resumes on the next app visit.
            });
          });
        })
        .catch(() => {
          // A transient connection issue simply resumes on the next app visit.
        });
    };

    let cancelCommentaryPreparation = () => {};
    let cancelBiblePreparation = scheduleWhenQuiet(beginBiblePreparation);

    const resumePreparation = () => {
      cancelBiblePreparation();
      cancelBiblePreparation = scheduleWhenQuiet(beginBiblePreparation);
    };

    window.addEventListener('online', resumePreparation);

    return () => {
      cancelled = true;
      window.removeEventListener('online', resumePreparation);
      cancelBiblePreparation();
      cancelCommentaryPreparation();
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

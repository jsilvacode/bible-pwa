import { useCallback, useEffect, useState } from 'react';

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(
    () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
  );

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      if (isInstalled) return;
      event.preventDefault();
      setInstallPrompt(event);
      window.__bibleInstallPrompt = event;
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      window.__bibleInstallPrompt = null;
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [isInstalled]);

  const promptInstall = useCallback(async () => {
    if (isInstalled) {
      return { ok: false, message: 'La aplicación ya está instalada.' };
    }

    const deferred = installPrompt || window.__bibleInstallPrompt;
    if (!deferred) {
      return { ok: false, message: 'Usa el menú del navegador para instalar.' };
    }

    try {
      await deferred.prompt();
      await deferred.userChoice;
      setInstallPrompt(null);
      window.__bibleInstallPrompt = null;
      return { ok: true, message: 'Solicitud enviada.' };
    } catch {
      return { ok: false, message: 'Error al iniciar instalación.' };
    }
  }, [installPrompt, isInstalled]);

  return { installPrompt, isInstalled, promptInstall };
}

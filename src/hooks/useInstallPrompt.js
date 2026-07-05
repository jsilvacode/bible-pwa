import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const InstallPromptContext = createContext(null);

export function InstallPromptProvider({ children }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallPopup, setShowInstallPopup] = useState(false);
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
      setShowInstallPopup(true);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
      setShowInstallPopup(false);
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

    if (!installPrompt) {
      return { ok: false, message: 'Usa el menú del navegador para instalar.' };
    }

    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      setShowInstallPopup(false);
      return { ok: true, message: 'Solicitud enviada.' };
    } catch {
      return { ok: false, message: 'Error al iniciar instalación.' };
    }
  }, [installPrompt, isInstalled]);

  const dismissInstallPopup = useCallback(() => {
    setShowInstallPopup(false);
  }, []);

  const value = useMemo(
    () => ({
      installPrompt,
      isInstalled,
      showInstallPopup,
      promptInstall,
      dismissInstallPopup,
    }),
    [installPrompt, isInstalled, showInstallPopup, promptInstall, dismissInstallPopup]
  );

  return createElement(InstallPromptContext.Provider, { value }, children);
}

export function useInstallPrompt() {
  const context = useContext(InstallPromptContext);
  if (!context) {
    throw new Error('useInstallPrompt must be used within an InstallPromptProvider');
  }
  return context;
}

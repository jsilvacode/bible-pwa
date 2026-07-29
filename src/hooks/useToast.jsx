import { createContext, createElement, useCallback, useContext, useMemo, useState } from 'react';
import classes from '../components/ui/Toast.module.css';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, duration = 3000) => {
    setToast({ message, id: Date.now() });
    setTimeout(() => setToast(null), duration);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return createElement(
    ToastContext.Provider,
    { value },
    children,
    toast && (
      <div className={classes.toast} role="status" aria-live="polite">
        {toast.message}
      </div>
    )
  );
}

// Provider y hook comparten este módulo para conservar una única API de notificaciones.
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

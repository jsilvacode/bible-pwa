import { useEffect } from 'react';

/**
 * Cierra un modal con la tecla Escape y bloquea el scroll del body mientras está activo.
 * @param {boolean} active
 * @param {() => void} onClose
 */
export function useModalDismiss(active, onClose) {
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [active, onClose]);
}

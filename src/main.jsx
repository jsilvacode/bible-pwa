import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';
import { registerSW } from 'virtual:pwa-register';

function registerServiceWorker() {
  let updateSW;
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      if (confirm('Nueva versión disponible. ¿Deseas actualizar?')) {
        updateSW(true);
      }
    },
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
  });
}

// El service worker no compite con el primer render ni con la carga del versículo diario.
if ('requestIdleCallback' in window) {
  window.requestIdleCallback(registerServiceWorker, { timeout: 3000 });
} else {
  window.addEventListener('load', () => window.setTimeout(registerServiceWorker, 500), { once: true });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

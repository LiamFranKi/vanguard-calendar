import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { registerServiceWorker, setupInstallPrompt } from './utils/pwa.js';

// Renderizar la aplicación
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registrar Service Worker para PWA (habilitado temporalmente para testing)
registerServiceWorker()
  .then((registration) => {
    if (registration) {
      console.log('[PWA] Service Worker registrado exitosamente');
    }
  })
  .catch((error) => {
    console.error('[PWA] Error al registrar Service Worker:', error);
  });

// Configurar prompt de instalación
setupInstallPrompt();



import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register service worker for Progressive Web App (PWA) install capability in production environment only
// This prevents development caching conflicts and eliminates proxy redirect errors during dev bootup sequence
if ('serviceWorker' in navigator && (import.meta as any).env?.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('OpenClaw PWA: ServiceWorker active on scope:', reg.scope);
      })
      .catch((err) => {
        console.error('OpenClaw PWA: ServiceWorker registration error:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

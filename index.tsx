
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Apply theme immediately on both html root and body to avoid white flashes
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  document.documentElement.classList.add('light');
  document.documentElement.classList.remove('dark');
  document.body.classList.add('light');
  document.body.classList.remove('dark');
} else {
  document.documentElement.classList.add('dark');
  document.documentElement.classList.remove('light');
  document.body.classList.add('dark');
  document.body.classList.remove('light');
}

// In standalone PWA mode, ensure external links opened via anchor tags do not replace the host webview
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('a');
    if (target && target.getAttribute('target') === '_blank') {
      target.setAttribute('rel', 'noopener noreferrer');
    }
  }, { capture: true });
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Unregister any active service workers and clear caches silently to prevent broken/stale development assets
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister().then(() => {
        console.log('ServiceWorker unregistered silently');
      });
    });
  });
}

if ('caches' in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => caches.delete(key));
  });
}

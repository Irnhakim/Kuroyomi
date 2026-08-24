import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './services/i18n.tsx'
import { ModalProvider } from './services/modal.tsx'

// Disable and unregister active service workers to clear browser cache and avoid intercepting requests
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister()
        .then(success => {
          if (success) console.log('Active Service Worker unregistered successfully');
        })
        .catch(err => console.warn('Failed to unregister Service Worker:', err));
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ModalProvider>
        <App />
      </ModalProvider>
    </LanguageProvider>
  </StrictMode>,
)

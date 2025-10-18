if (import.meta.env.MODE === 'development') {
  console.log('Dev mode: show logs');
} else {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthProvider.tsx'
import './index.css'
import './themes/pistachio.css'

const savedTheme = localStorage.getItem('selectedTheme');
if (savedTheme && savedTheme !== 'pistachio') {
    const themeLink = document.createElement('link');
    themeLink.rel = 'stylesheet';
    themeLink.href = `/themes/${savedTheme}.css`;
    themeLink.dataset.theme = 'true';
    document.head.appendChild(themeLink);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>,
  </StrictMode>,
)

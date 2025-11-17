import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { ThemeProvider } from './hooks/ThemeProvider.jsx'
import ErrorOverlay from './components/ErrorOverlay'
import './utils/resetAdmin'

// Global error handlers to ensure runtime errors show the overlay in production builds
window.addEventListener('error', (e) => {
  console.error('Global error captured:', e.error || e.message, e);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason || e);
});

// Use HashRouter when running from file:// (Electron packaged build)
const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <ThemeProvider>
        <ErrorOverlay>
          <App />
        </ErrorOverlay>
      </ThemeProvider>
    </Router>
  </React.StrictMode>,
)

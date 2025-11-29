import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { ThemeProvider } from './hooks/ThemeProvider.jsx'
import ErrorOverlay from './components/ErrorOverlay'
import './utils/adminSetup'
import { initializePermissionSystem } from './utils/permissionHelpers'
import { initPathConfig } from './utils/pathConfig'
import './utils/globalErrorHandler'
import './utils/errorLogger'
import './utils/writeBehindCacheManager' // Initialize cache manager
import { preventDOMTokenErrors } from './utils/classNameHelpers.js'

// Initialize DOM token error prevention with proper timing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    preventDOMTokenErrors();
  });
} else {
  // DOM already loaded
  setTimeout(() => {
    preventDOMTokenErrors();
  }, 0);
}

// Initialize core systems on app start
initializePermissionSystem().catch(console.error);
initPathConfig().catch(console.error);

console.log('🚀 Malwa CRM v2.0.0 - Enhanced Database System');
console.log('📁 Database Location: C:/malwa-crm/Data_base/');
console.log('🗂️ Using indexeddb_file_mapping.json structure');

// Global error handlers to ensure runtime errors show the overlay in production builds
window.addEventListener('error', (e) => {
  console.error('Global error captured:', e.error || e.message, e);
});

// Global promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
  console.warn('Promise rejection (handled):', e.reason);
  // Log but don't prevent default behavior
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

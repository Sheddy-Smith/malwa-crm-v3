const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // App path methods
  getAppPaths: () => ipcRenderer.invoke('get-app-paths'),
  getCustomDataPath: () => Promise.resolve('C:/malwa-crm'),
  getDatabasePath: () => Promise.resolve('C:/malwa-crm/Data_base'),
  
  // File system operations
  ensureDirectory: (dirPath) => ipcRenderer.invoke('ensure-directory', dirPath),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),
  openPath: (filePath) => ipcRenderer.invoke('open-path', filePath),
  
  // Dialog methods
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // Database configuration
  getDbConfig: () => ipcRenderer.invoke('get-db-config'),
  initDbStructure: () => ipcRenderer.invoke('init-db-structure'),
  
  // Sync operations
  triggerManualSync: () => ipcRenderer.invoke('trigger-manual-sync'),
  onSyncTrigger: (callback) => ipcRenderer.on('trigger-data-sync', callback),
  onPerformSync: (callback) => ipcRenderer.on('perform-data-sync', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // App info
  isElectron: true,
  platform: process.platform,
  
  // Version info
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  
  // Write-Behind Cache APIs
  cache: {
    ensureDir: (dirPath) => ipcRenderer.invoke('cache-ensure-dir', dirPath),
    readFile: (filePath) => ipcRenderer.invoke('cache-read-file', filePath),
    writeFile: (filePath, data) => ipcRenderer.invoke('cache-write-file', filePath, data),
    appendFile: (filePath, data) => ipcRenderer.invoke('cache-append-file', filePath, data),
    getStats: (filePath) => ipcRenderer.invoke('cache-get-stats', filePath),
    deleteFile: (filePath) => ipcRenderer.invoke('cache-delete-file', filePath)
  },
  
  // File system API namespace (for backward compatibility)
  fs: {
    ensureDir: (dirPath) => ipcRenderer.invoke('cache-ensure-dir', dirPath),
    readFile: (filePath) => ipcRenderer.invoke('cache-read-file', filePath),
    writeFile: (filePath, data) => ipcRenderer.invoke('cache-write-file', filePath, data),
    appendFile: (filePath, data) => ipcRenderer.invoke('cache-append-file', filePath, data),
    deleteFile: (filePath) => ipcRenderer.invoke('cache-delete-file', filePath),
    pathExists: (filePath) => ipcRenderer.invoke('file-exists', filePath)
  },
  
  // Alias for backward compatibility
  ensureDir: (dirPath) => ipcRenderer.invoke('cache-ensure-dir', dirPath),
  appendToFile: (filePath, data) => ipcRenderer.invoke('cache-append-file', filePath, data),
  
  // Permission APIs (role-based)
  permissions: {
    checkByRole: (role, module, page, action) => ipcRenderer.invoke('check-permission-by-role', { role, module, page, action }),
    check: (userId, permissionCode, role) => ipcRenderer.invoke('check-permission', { userId, permissionCode, role })
  }
});

// Expose a limited API for the renderer
contextBridge.exposeInMainWorld('malwaCRM', {
  dataPath: 'C:/malwa-crm',
  databasePath: 'C:/malwa-crm/Data_base',
  
  // Utility functions
  getStoragePath: (subPath = '') => {
    return subPath ? `C:/malwa-crm/${subPath}` : 'C:/malwa-crm';
  },
  
  // Environment detection
  isDesktopApp: true,
  isDevelopment: process.env.NODE_ENV === 'development'
});

console.log('🔗 [PRELOAD.CJS] Malwa CRM Preload Script Loaded Successfully!');
console.log('📁 [PRELOAD.CJS] Data Path: C:/malwa-crm');
console.log('✅ [PRELOAD.CJS] window.electron exposed with cache APIs');
console.log('✅ [PRELOAD.CJS] window.malwaCRM exposed');
console.log('📋 [PRELOAD.CJS] Available APIs:', {
  electron: {
    getCustomDataPath: 'function',
    getDatabasePath: 'function',
    cache: {
      ensureDir: 'function',
      readFile: 'function', 
      writeFile: 'function',
      appendFile: 'function',
      deleteFile: 'function'
    },
    fs: {
      ensureDir: 'function',
      readFile: 'function',
      writeFile: 'function',
      appendFile: 'function',
      deleteFile: 'function',
      pathExists: 'function'
    },
    ensureDir: 'function (alias)',
    appendToFile: 'function (alias)'
  }
});
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // App info
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // Platform info
  platform: process.platform,
  
  // Permission system IPC handlers
  hashPassword: (password) => ipcRenderer.invoke('hash-password', password),
  verifyPassword: (password, hash) => ipcRenderer.invoke('verify-password', { password, hash }),
  validateSession: (token) => ipcRenderer.invoke('validate-session', token),
  checkPermission: (userId, permissionCode) => ipcRenderer.invoke('check-permission', { userId, permissionCode }),
  
  // Data export/import
  exportData: (data, encrypt) => ipcRenderer.invoke('export-data', { data, encrypt }),
  importData: () => ipcRenderer.invoke('import-data'),
  
  // Backup/restore
  backupDatabase: (stores) => ipcRenderer.invoke('backup-database', { stores }),
  restoreDatabase: () => ipcRenderer.invoke('restore-database'),
  
  // Audit logging
  logAudit: (auditData) => ipcRenderer.invoke('log-audit', auditData),
  
  // Custom File System Operations for C:/malwa_crm/data-base
  fs: {
    // Original methods (for backward compatibility)
    readFileOld: (fileName) => ipcRenderer.invoke('fs-read-file', fileName),
    writeFileOld: (fileName, content) => ipcRenderer.invoke('fs-write-file', fileName, content),
    listFiles: () => ipcRenderer.invoke('fs-list-files'),
    deleteFile: (fileName) => ipcRenderer.invoke('fs-delete-file', fileName),
    fileExists: (fileName) => ipcRenderer.invoke('fs-file-exists', fileName),
    getDbPath: () => ipcRenderer.invoke('fs-get-db-path'),
    backupDatabase: (data) => ipcRenderer.invoke('fs-backup-database', data),
    restoreDatabase: (fileName) => ipcRenderer.invoke('fs-restore-database', fileName),
    
    // Enhanced methods for new data management system (with full path support)
    ensureDir: (dirPath) => ipcRenderer.invoke('fs-ensure-dir', dirPath),
    pathExists: (filePath) => ipcRenderer.invoke('fs-path-exists', filePath),
    readFile: (filePath) => ipcRenderer.invoke('fs-read-file-path', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('fs-write-file-path', filePath, content),
    listDir: (dirPath) => ipcRenderer.invoke('fs-list-dir', dirPath)
  }
});

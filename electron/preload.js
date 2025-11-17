/**
 * Electron Preload Script
 * Exposes secure IPC methods to renderer process
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose file system operations to renderer
contextBridge.exposeInMainWorld('electron', {
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  getDbConfig: () => ipcRenderer.invoke('get-db-config'),
  fs: {
    writeFile: (fileName, content) => ipcRenderer.invoke('fs:writeFile', fileName, content),
    readFile: (fileName) => ipcRenderer.invoke('fs:readFile', fileName),
    listFiles: () => ipcRenderer.invoke('fs:listFiles'),
    deleteFile: (fileName) => ipcRenderer.invoke('fs:deleteFile', fileName),
    fileExists: (fileName) => ipcRenderer.invoke('fs:fileExists', fileName),
    getBackupPath: () => ipcRenderer.invoke('fs:getBackupPath'),
    openBackupFolder: () => ipcRenderer.invoke('fs:openBackupFolder'),
    getFolderSize: () => ipcRenderer.invoke('fs:getFolderSize')
  },
  isElectron: true,
  platform: process.platform
});

console.log('✅ Preload script loaded - Electron APIs exposed');

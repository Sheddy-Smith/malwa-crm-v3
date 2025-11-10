const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const isDev = process.env.NODE_ENV === 'development';

// Database backup path
const MALWA_CRM_ROOT = 'C:/malwa_crm';
const BACKUP_PATH = path.join(MALWA_CRM_ROOT, 'Data_Base');

// Global error handlers to capture crashes in the main process and make logs
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception in main process:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection in main process:', reason);
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#ffffff',
    show: false,
    autoHideMenuBar: true,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // In production builds open DevTools automatically to help debug blank
  // windows during testing. Remove or guard this before final release.
  if (!isDev) {
    try {
      mainWindow.webContents.openDevTools({ mode: 'right' });
    } catch (err) {
      console.warn('Could not open DevTools in production:', err);
    }
  }

  // Forward renderer console messages to the main process log so they are
  // available in system logs and easier to inspect when debugging installed apps.
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Ctrl+R',
          click: () => {
            mainWindow.reload();
          },
        },
        {
          label: 'Toggle DevTools',
          accelerator: 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          },
        },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'Ctrl+0',
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          },
        },
        {
          label: 'Zoom In',
          accelerator: 'Ctrl+=',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
          },
        },
        {
          label: 'Zoom Out',
          accelerator: 'Ctrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
          },
        },
        { type: 'separator' },
        {
          label: 'Toggle Full Screen',
          accelerator: 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Malwa CRM',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Malwa CRM',
              message: 'Malwa Trolley CRM',
              detail: 'Version: 2.0.0\nLocal-First Customer Management System\n\nContact:\nEmail: malwatrolley@gmail.com\nPhone: +91 8224000822\n\n© 2025 Malwa Trolley CRM',
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', async () => {
  console.log('Malwa CRM Desktop App Started');
  console.log('Version: 2.0.0');
  console.log('Platform:', process.platform);
  console.log('Electron Version:', process.versions.electron);

  // Create folder structure if it doesn't exist
  await ensureFolderStructure();
});

// ==================== File System Operations ====================

/**
 * Ensure C:/malwa_crm/Data_Base/ folder structure exists
 */
async function ensureFolderStructure() {
  try {
    await fs.mkdir(MALWA_CRM_ROOT, { recursive: true });
    await fs.mkdir(BACKUP_PATH, { recursive: true });
    console.log('✅ Folder structure created:', MALWA_CRM_ROOT);
  } catch (error) {
    console.error('❌ Failed to create folder structure:', error);
  }
}

/**
 * Write file to Data_Base folder
 */
ipcMain.handle('fs:writeFile', async (event, fileName, content) => {
  try {
    await ensureFolderStructure();
    const filePath = path.join(BACKUP_PATH, fileName);
    await fs.writeFile(filePath, content, 'utf8');
    console.log('✅ File saved:', filePath);
    return { success: true, path: filePath };
  } catch (error) {
    console.error('❌ Failed to write file:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Read file from Data_Base folder
 */
ipcMain.handle('fs:readFile', async (event, fileName) => {
  try {
    const filePath = path.join(BACKUP_PATH, fileName);
    const content = await fs.readFile(filePath, 'utf8');
    console.log('✅ File read:', filePath);
    return { success: true, content };
  } catch (error) {
    console.error('❌ Failed to read file:', error);
    return { success: false, error: error.message };
  }
});

/**
 * List all backup files in Data_Base folder
 */
ipcMain.handle('fs:listFiles', async () => {
  try {
    await ensureFolderStructure();
    const files = await fs.readdir(BACKUP_PATH);
    const backupFiles = files.filter(f => f.endsWith('.json'));

    const fileDetails = await Promise.all(
      backupFiles.map(async (fileName) => {
        const filePath = path.join(BACKUP_PATH, fileName);
        const stats = await fs.stat(filePath);
        return {
          name: fileName,
          path: filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
    );

    console.log(`✅ Found ${fileDetails.length} backup files`);
    return { success: true, files: fileDetails };
  } catch (error) {
    console.error('❌ Failed to list files:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Delete backup file
 */
ipcMain.handle('fs:deleteFile', async (event, fileName) => {
  try {
    const filePath = path.join(BACKUP_PATH, fileName);
    await fs.unlink(filePath);
    console.log('✅ File deleted:', filePath);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to delete file:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Check if file exists
 */
ipcMain.handle('fs:fileExists', async (event, fileName) => {
  try {
    const filePath = path.join(BACKUP_PATH, fileName);
    await fs.access(filePath);
    return { success: true, exists: true };
  } catch (error) {
    return { success: true, exists: false };
  }
});

/**
 * Get backup folder path
 */
ipcMain.handle('fs:getBackupPath', async () => {
  return { success: true, path: BACKUP_PATH };
});

/**
 * Open backup folder in file explorer
 */
ipcMain.handle('fs:openBackupFolder', async () => {
  try {
    await ensureFolderStructure();
    const { shell } = require('electron');
    await shell.openPath(BACKUP_PATH);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to open folder:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Get folder size
 */
ipcMain.handle('fs:getFolderSize', async () => {
  try {
    const files = await fs.readdir(BACKUP_PATH);
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(BACKUP_PATH, file);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
    }

    return { success: true, size: totalSize, count: files.length };
  } catch (error) {
    console.error('❌ Failed to get folder size:', error);
    return { success: false, error: error.message };
  }
});

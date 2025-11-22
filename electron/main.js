const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

// Import IPC handlers for permission system
require('./ipc-handlers');

let mainWindow;

function createWindow() {
  // Determine if in development mode
  const isDev = false; // Force production mode for testing
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'Malwa CRM',
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../build/icon.png')
  });

  // Load from Vite dev server or built files
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const htmlPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading HTML from:', htmlPath);
    
    // Use loadFile method which is the proper way for Electron
    mainWindow.loadFile(htmlPath).catch(err => {
      console.error('Failed to load file:', err);
      
      // Fallback: try to load with file:// protocol
      const fileUrl = `file://${htmlPath.replace(/\\/g, '/')}`;
      console.log('Trying fallback URL:', fileUrl);
      mainWindow.loadURL(fileUrl);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);

  // Enable right-click context menu
  mainWindow.webContents.on('context-menu', (event, params) => {
    const { x, y, selectionText, isEditable } = params;

    // Create context menu based on context
    const menuTemplate = [];

    if (isEditable) {
      // Context menu for editable fields (input, textarea)
      menuTemplate.push(
        {
          label: 'Cut',
          role: 'cut',
          enabled: selectionText.length > 0,
          accelerator: 'CmdOrCtrl+X'
        },
        {
          label: 'Copy',
          role: 'copy',
          enabled: selectionText.length > 0,
          accelerator: 'CmdOrCtrl+C'
        },
        {
          label: 'Paste',
          role: 'paste',
          accelerator: 'CmdOrCtrl+V'
        },
        { type: 'separator' },
        {
          label: 'Select All',
          role: 'selectAll',
          accelerator: 'CmdOrCtrl+A'
        }
      );
    } else if (selectionText.length > 0) {
      // Context menu for selected text (non-editable)
      menuTemplate.push(
        {
          label: 'Copy',
          role: 'copy',
          accelerator: 'CmdOrCtrl+C'
        },
        { type: 'separator' },
        {
          label: 'Select All',
          role: 'selectAll',
          accelerator: 'CmdOrCtrl+A'
        }
      );
    } else {
      // Default context menu
      menuTemplate.push(
        {
          label: 'Reload',
          role: 'reload',
          accelerator: 'CmdOrCtrl+R'
        },
        {
          label: 'Force Reload',
          role: 'forceReload',
          accelerator: 'CmdOrCtrl+Shift+R'
        }
      );

      // Add developer tools option in development mode
      if (isDev) {
        menuTemplate.push(
          { type: 'separator' },
          {
            label: 'Toggle Developer Tools',
            role: 'toggleDevTools',
            accelerator: 'CmdOrCtrl+Shift+I'
          }
        );
      }
    }

    // Build and show the context menu
    const contextMenu = Menu.buildFromTemplate(menuTemplate);
    contextMenu.popup({ window: mainWindow, x, y });
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app events
app.on('ready', () => {
  console.log('Malwa CRM is ready');
});

// IPC handlers for potential future use
ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('get-version', () => {
  return app.getVersion();
});

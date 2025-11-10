const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

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

app.on('ready', () => {
  console.log('Malwa CRM Desktop App Started');
  console.log('Version: 2.0.0');
  console.log('Platform:', process.platform);
  console.log('Electron Version:', process.versions.electron);
});

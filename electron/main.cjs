const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = !app.isPackaged;

// Set custom userData path to C:/malwa-crm
const MALWA_CRM_PATH = 'C:/malwa-crm';
app.setPath('userData', MALWA_CRM_PATH);
app.setPath('documents', path.join(MALWA_CRM_PATH, 'Documents'));
app.setPath('downloads', path.join(MALWA_CRM_PATH, 'Downloads'));
app.setPath('temp', path.join(MALWA_CRM_PATH, 'Temp'));

let mainWindow;

// Ensure Malwa CRM directory structure exists
const ensureDirectoryStructure = () => {
  const directories = [
    // Root directories
    MALWA_CRM_PATH,
    path.join(MALWA_CRM_PATH, 'Data_base'),
    path.join(MALWA_CRM_PATH, 'Cache'), // Cache directory for write-behind cache
    
    // Module directories (matching indexeddb_file_mapping.json)
    path.join(MALWA_CRM_PATH, 'Data_base', 'accounts'),
    path.join(MALWA_CRM_PATH, 'Data_base', 'Accounts_Module'),
    path.join(MALWA_CRM_PATH, 'Data_base', 'customer'),
    path.join(MALWA_CRM_PATH, 'Data_base', 'inventory'),
    path.join(MALWA_CRM_PATH, 'Data_base', 'jobs'),
    path.join(MALWA_CRM_PATH, 'Data_base', 'labour'),
    path.join(MALWA_CRM_PATH, 'Data_base', 'settings'),
    path.join(MALWA_CRM_PATH, 'Data_base', 'summary'),
    path.join(MALWA_CRM_PATH, 'Data_base', 'supplier'),
    path.join(MALWA_CRM_PATH, 'Data_base', 'vendors'),
    
    // Sync and backup directories
    path.join(MALWA_CRM_PATH, 'Data_base', 'GoogleDrive_Sync'),
    path.join(MALWA_CRM_PATH, 'Data_base', 'Automatic Backups')
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};

const createWindow = () => {
  // Ensure directory structure before creating window
  ensureDirectoryStructure();

  // Get the absolute path to preload script
  // In development: app.getAppPath() returns the project root
  // In production: app.getAppPath() returns the asar or resources path
  const preloadPath = isDev
    ? path.join(app.getAppPath(), 'electron', 'preload.cjs')
    : path.join(__dirname, 'preload.cjs');
  
  console.log('📋 [MAIN] isDev:', isDev);
  console.log('📋 [MAIN] __dirname:', __dirname);
  console.log('📋 [MAIN] app.getAppPath():', app.getAppPath());
  console.log('📋 [MAIN] Preload script path:', preloadPath);
  console.log('📋 [MAIN] Preload exists:', fs.existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
    show: false,
    titleBarStyle: 'default',
    backgroundColor: '#1e40af',
    frame: true,
    resizable: true,
    fullscreenable: true,
    maximizable: true,
    minimizable: true
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (!isDev) {
      mainWindow.maximize();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Block default browser keyboard shortcuts for refresh
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Block F5 (all variations)
    if (input.key === 'F5' || input.key === 'f5') {
      event.preventDefault();
      return;
    }
    // Block Ctrl+R and Cmd+R
    if ((input.control || input.meta) && (input.key === 'r' || input.key === 'R')) {
      event.preventDefault();
      return;
    }
    // Block Ctrl+Shift+R (force refresh)
    if ((input.control || input.meta) && input.shift && (input.key === 'r' || input.key === 'R')) {
      event.preventDefault();
      return;
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Setup custom right-click context menu
  mainWindow.webContents.on('context-menu', (event, params) => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Refresh',
        accelerator: 'F5',
        click: () => {
          // Trigger cache flush with toast notification
          mainWindow.webContents.executeJavaScript(`
            (async () => {
              try {
                if (window.cacheManager && typeof window.cacheManager.flush === 'function') {
                  const result = await window.cacheManager.flush();
                  console.log('✅ Cache Flush completed:', result);
                  // Show toast notification
                  if (window.toast) {
                    window.toast.success('Cache refreshed!', {
                      description: 'Local cache has been flushed to disk',
                      duration: 2000
                    });
                  }
                  return { success: true, result };
                } else {
                  console.warn('⚠️ Cache manager not available');
                  if (window.toast) {
                    window.toast.warning('Cache manager not available');
                  }
                  return { success: false, error: 'Cache manager not available' };
                }
              } catch (error) {
                console.error('❌ Cache flush error:', error);
                if (window.toast) {
                  window.toast.error('Cache flush failed: ' + error.message);
                }
                return { success: false, error: error.message };
              }
            })()
          `);
        }
      },
      {
        label: 'Sync Data',
        accelerator: 'CmdOrCtrl+S',
        click: () => {
          // Trigger force upload with toast
          mainWindow.webContents.executeJavaScript(`
            (async () => {
              try {
                if (window.cacheManager && typeof window.cacheManager.uploadNow === 'function') {
                  const result = await window.cacheManager.uploadNow();
                  console.log('✅ Force Upload completed:', result);
                  // Show toast notification
                  if (window.toast) {
                    window.toast.success('Data synced successfully!', {
                      description: 'All pending changes have been uploaded',
                      duration: 3000
                    });
                  }
                  return { success: true, result };
                } else {
                  console.warn('⚠️ Cache manager not available');
                  if (window.toast) {
                    window.toast.warning('Cache manager not available');
                  }
                  return { success: false, error: 'Cache manager not available' };
                }
              } catch (error) {
                console.error('❌ Force upload error:', error);
                if (window.toast) {
                  window.toast.error('Sync failed: ' + error.message);
                }
                return { success: false, error: error.message };
              }
            })()
          `);
        }
      },
      {
        label: 'Force Reload',
        accelerator: 'CmdOrCtrl+Shift+R',
        click: () => {
          mainWindow.webContents.reloadIgnoringCache();
        }
      },
      { type: 'separator' },
      {
        label: 'Zoom In',
        accelerator: 'CmdOrCtrl+Plus',
        click: () => {
          const currentZoom = mainWindow.webContents.getZoomLevel();
          mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
        }
      },
      {
        label: 'Zoom Out',
        accelerator: 'CmdOrCtrl+-',
        click: () => {
          const currentZoom = mainWindow.webContents.getZoomLevel();
          mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
        }
      },
      {
        label: 'Reset Zoom',
        accelerator: 'CmdOrCtrl+0',
        click: () => {
          mainWindow.webContents.setZoomLevel(0);
        }
      },
      { type: 'separator' },
      {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        enabled: params.editFlags.canCut,
        click: () => {
          mainWindow.webContents.cut();
        }
      },
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        enabled: params.editFlags.canCopy,
        click: () => {
          mainWindow.webContents.copy();
        }
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        enabled: params.editFlags.canPaste,
        click: () => {
          mainWindow.webContents.paste();
        }
      },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        enabled: params.editFlags.canSelectAll,
        click: () => {
          mainWindow.webContents.selectAll();
        }
      },
      { type: 'separator' },
      {
        label: 'Inspect Element',
        visible: isDev,
        click: () => {
          mainWindow.webContents.inspectElement(params.x, params.y);
        }
      }
    ]);

    contextMenu.popup({
      window: mainWindow,
      x: params.x,
      y: params.y
    });
  });
};

// App event handlers
app.whenReady().then(() => {
  createWindow();
  
  // Remove default application menu (File, View, Window, Help)
  Menu.setApplicationMenu(null);
  
  // Set up global keyboard shortcuts
  const { globalShortcut } = require('electron');
  
  // Register global shortcuts for cache flush (not page reload)
  globalShortcut.register('F5', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      // Trigger cache flush with toast
      mainWindow.webContents.executeJavaScript(`
        (async () => {
          try {
            if (window.cacheManager && typeof window.cacheManager.flush === 'function') {
              const result = await window.cacheManager.flush();
              console.log('✅ Cache Flush (F5):', result);
              if (window.toast) {
                window.toast.success('Cache refreshed!', {
                  description: 'Local cache has been flushed to disk',
                  duration: 2000
                });
              }
              return { success: true, result };
            } else {
              console.warn('⚠️ Cache manager not available');
              if (window.toast) {
                window.toast.warning('Cache manager not available');
              }
              return { success: false, error: 'Cache manager not available' };
            }
          } catch (error) {
            console.error('❌ Cache flush error:', error);
            if (window.toast) {
              window.toast.error('Cache flush failed: ' + error.message);
            }
            return { success: false, error: error.message };
          }
        })()
      `);
    }
  });
  
  globalShortcut.register('CommandOrControl+S', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      // Trigger force upload with toast
      mainWindow.webContents.executeJavaScript(`
        (async () => {
          try {
            if (window.cacheManager && typeof window.cacheManager.uploadNow === 'function') {
              const result = await window.cacheManager.uploadNow();
              console.log('✅ Force Upload (Ctrl+S):', result);
              if (window.toast) {
                window.toast.success('Data synced successfully!', {
                  description: 'All pending changes have been uploaded',
                  duration: 3000
                });
              }
              return { success: true, result };
            } else {
              console.warn('⚠️ Cache manager not available');
              if (window.toast) {
                window.toast.warning('Cache manager not available');
              }
              return { success: false, error: 'Cache manager not available' };
            }
          } catch (error) {
            console.error('❌ Force upload error:', error);
            if (window.toast) {
              window.toast.error('Sync failed: ' + error.message);
            }
            return { success: false, error: error.message };
          }
        })()
      `);
    }
  });
  
  globalShortcut.register('CommandOrControl+Plus', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const currentZoom = mainWindow.webContents.getZoomLevel();
      mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
    }
  });
  
  globalShortcut.register('CommandOrControl+-', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const currentZoom = mainWindow.webContents.getZoomLevel();
      mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
    }
  });
  
  globalShortcut.register('CommandOrControl+0', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.setZoomLevel(0);
    }
  });

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

// IPC handlers for file system operations
ipcMain.handle('get-app-paths', () => {
  return {
    userData: app.getPath('userData'),
    documents: app.getPath('documents'),
    downloads: app.getPath('downloads'),
    temp: app.getPath('temp'),
    database: path.join(MALWA_CRM_PATH, 'Data_base'),
    backups: path.join(MALWA_CRM_PATH, 'Backups'),
    reports: path.join(MALWA_CRM_PATH, 'Reports'),
    exports: path.join(MALWA_CRM_PATH, 'Exports'),
    logs: path.join(MALWA_CRM_PATH, 'Logs')
  };
});

ipcMain.handle('ensure-directory', async (event, dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, filePath, data) => {
  try {
    fs.writeFileSync(filePath, data, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file-exists', async (event, filePath) => {
  return fs.existsSync(filePath);
});

ipcMain.handle('open-path', async (event, filePath) => {
  return shell.openPath(filePath);
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// Database configuration
ipcMain.handle('get-db-config', () => {
  return {
    path: path.join(MALWA_CRM_PATH, 'Data_base'),
    name: 'malwa_crm_db',
    version: 14
  };
});

// Manual sync trigger
ipcMain.handle('trigger-manual-sync', async () => {
  try {
    console.log('🔄 Manual sync triggered from menu');
    // Send message to renderer to perform sync
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('perform-data-sync');
      return { success: true, message: 'Sync initiated' };
    }
    return { success: false, error: 'Window not available' };
  } catch (error) {
    console.error('❌ Manual sync failed:', error);
    return { success: false, error: error.message };
  }
});

// ==========================================
// WRITE-BEHIND CACHE IPC HANDLERS
// ==========================================

// Cache directory operations
ipcMain.handle('cache-ensure-dir', async (event, dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return { success: true };
  } catch (error) {
    console.error('❌ Cache ensure-dir failed:', error);
    return { success: false, error: error.message };
  }
});

// Cache read file
ipcMain.handle('cache-read-file', async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Cache read-file failed:', error);
    return { success: false, error: error.message };
  }
});

// Cache write file
ipcMain.handle('cache-write-file', async (event, filePath, data) => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, data, 'utf8');
    return { success: true };
  } catch (error) {
    console.error('❌ Cache write-file failed:', error);
    return { success: false, error: error.message };
  }
});

// Cache append file
ipcMain.handle('cache-append-file', async (event, filePath, data) => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.appendFileSync(filePath, data, 'utf8');
    return { success: true };
  } catch (error) {
    console.error('❌ Cache append-file failed:', error);
    return { success: false, error: error.message };
  }
});

// Cache get file stats
ipcMain.handle('cache-get-stats', async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }
    const stats = fs.statSync(filePath);
    return { 
      success: true, 
      stats: {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      }
    };
  } catch (error) {
    console.error('❌ Cache get-stats failed:', error);
    return { success: false, error: error.message };
  }
});

// Cache delete file
ipcMain.handle('cache-delete-file', async (event, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { success: true };
  } catch (error) {
    console.error('❌ Cache delete-file failed:', error);
    return { success: false, error: error.message };
  }
});

// Initialize IndexedDB file structure
ipcMain.handle('init-db-structure', async () => {
  const indexeddbMapping = [
    {
      target_folder: path.join(MALWA_CRM_PATH, 'Data_base'),
      files: [
        "meta.json", "Accounts.json", "CashReceipt.json", "Customer.json",
        "DailyTasks.json", "Dashboard.json", "Inventory.json", "Jobs.json",
        "Labour.json", "Login.json", "Settings.json", "Summary.json",
        "Supplier.json", "Vendors.json", "SyncQueue.json", "JobOperationsQueue.json",
        "UserPageVisibility.json"
      ]
    },
    {
      target_folder: path.join(MALWA_CRM_PATH, 'Data_base', 'accounts'),
      files: [
        "accounts.json", "meta.json", "CashReceipt.json", "Challan.json",
        "Gstledger.json", "Invoice.json", "OtherExpenses.json", "Purchase.json",
        "Sellchallan.json", "Voucher.json"
      ]
    },
    {
      target_folder: path.join(MALWA_CRM_PATH, 'Data_base', 'customer'),
      files: [
        "customer.json", "meta.json", "CustomerDetailsTab.json",
        "CustomerLedgerTab.json", "LeadsTab.json"
      ]
    },
    {
      target_folder: path.join(MALWA_CRM_PATH, 'Data_base', 'inventory'),
      files: [
        "inventory.json", "meta.json", "CategoryManager.json",
        "StockMovements.json", "StockTab.json"
      ]
    },
    {
      target_folder: path.join(MALWA_CRM_PATH, 'Data_base', 'jobs'),
      files: [
        "jobs.json", "meta.json", "ChalanStep.json", "EstimateStep.json",
        "InspectionStep.json", "InvoiceStep.json", "JobSheetStep.json"
      ]
    },
    {
      target_folder: path.join(MALWA_CRM_PATH, 'Data_base', 'labour'),
      files: [
        "labour.json", "meta.json", "LabourDetailsTab.json",
        "LabourLedgerTab.json", "LabourLedgerView.json"
      ]
    },
    {
      target_folder: path.join(MALWA_CRM_PATH, 'Data_base', 'settings'),
      files: [
        "settings.json", "meta.json", "AboutTab.json", "AuditLogsTab.json",
        "BackupSettingsTab.json", "CompanyMasterTab.json", "GeneralSettingsTab.json",
        "InventorySettingsTab.json", "InvoiceSettingsTab.json", "LedgerSettingsTab.json",
        "MultiplierSettingsTab.json", "MyProfileTab.json", "RateListMemoryTab.json",
        "SecuritySettingsTab.json", "UserManagementTab.json", "RateHistory.json",
        "Templates.json", "Roles.json", "Permissions.json", "Taxes.json",
        "HsnCodes.json", "AuditLogs.json", "Sequences.json"
      ]
    },
    {
      target_folder: path.join(MALWA_CRM_PATH, 'Data_base', 'summary'),
      files: [
        "summary.json", "meta.json", "IncentiveSummary.json",
        "PenaltyCard.json", "SummaryDashboard.json"
      ]
    },
    {
      target_folder: path.join(MALWA_CRM_PATH, 'Data_base', 'supplier'),
      files: [
        "supplier.json", "meta.json", "SupplierDetailsTab.json",
        "SupplierLedgerTab.json"
      ]
    },
    {
      target_folder: path.join(MALWA_CRM_PATH, 'Data_base', 'vendors'),
      files: [
        "vendors.json", "meta.json", "VendorDetailsTab.json",
        "VendorLedgerTab.json"
      ]
    }
  ];

  try {
    for (const mapping of indexeddbMapping) {
      // Ensure directory exists
      if (!fs.existsSync(mapping.target_folder)) {
        fs.mkdirSync(mapping.target_folder, { recursive: true });
        console.log(`📁 Created directory: ${mapping.target_folder}`);
      }

      // Create JSON files if they don't exist
      for (const fileName of mapping.files) {
        const filePath = path.join(mapping.target_folder, fileName);
        if (!fs.existsSync(filePath)) {
          const initialData = fileName === 'meta.json' 
            ? { version: '1.0.0', created: new Date().toISOString(), lastModified: new Date().toISOString() }
            : {};
          
          fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
          console.log(`📄 Created file: ${filePath}`);
        }
      }
    }
    
    console.log('✅ Database structure initialized successfully');
    return { success: true, message: 'Database structure initialized' };
  } catch (error) {
    console.error('❌ Failed to initialize database structure:', error);
    return { success: false, error: error.message };
  }
});

console.log('🚀 Malwa CRM Electron Main Process Started');
console.log('📁 Data Directory:', MALWA_CRM_PATH);
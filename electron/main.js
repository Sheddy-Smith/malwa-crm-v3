const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// Import IPC handlers for permission system
require('./ipc-handlers');

// Set custom app data path
const customDataPath = 'C:/malwa-crm';
app.setPath('userData', customDataPath);

// Ensure the directory exists
if (!fs.existsSync(customDataPath)) {
  fs.mkdirSync(customDataPath, { recursive: true });
  console.log('📁 Created Malwa CRM data directory:', customDataPath);
}

// Initialize complete directory structure
const initializeDirectoryStructure = () => {
  const basePath = path.join(customDataPath, 'Data_base');
  
  // Define all directories to create
  const directories = [
    basePath,
    path.join(basePath, 'accounts'),
    path.join(basePath, 'customer'),
    path.join(basePath, 'inventory'),
    path.join(basePath, 'jobs'),
    path.join(basePath, 'labour'),
    path.join(basePath, 'settings'),
    path.join(basePath, 'summary'),
    path.join(basePath, 'supplier'),
    path.join(basePath, 'vendors'),
    path.join(basePath, 'GoogleDrive_Sync'),
    path.join(basePath, 'Automatic Backups')
  ];

  // Create all directories
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('📁 Created directory:', dir);
    }
  });

  // Define all JSON files to create with their paths
  const jsonFiles = [
    // Root level files
    { path: path.join(basePath, 'meta.json'), data: { version: '4.0.0', lastUpdated: new Date().toISOString() } },
    { path: path.join(basePath, 'Accounts.json'), data: {} },
    { path: path.join(basePath, 'CashReceipt.json'), data: {} },
    { path: path.join(basePath, 'Customer.json'), data: {} },
    { path: path.join(basePath, 'DailyTasks.json'), data: {} },
    { path: path.join(basePath, 'Dashboard.json'), data: {} },
    { path: path.join(basePath, 'Inventory.json'), data: {} },
    { path: path.join(basePath, 'Jobs.json'), data: {} },
    { path: path.join(basePath, 'Labour.json'), data: {} },
    { path: path.join(basePath, 'Login.json'), data: {} },
    { path: path.join(basePath, 'Settings.json'), data: {} },
    { path: path.join(basePath, 'Summary.json'), data: {} },
    { path: path.join(basePath, 'Supplier.json'), data: {} },
    { path: path.join(basePath, 'Vendors.json'), data: {} },
    { path: path.join(basePath, 'SyncQueue.json'), data: {} },
    { path: path.join(basePath, 'JobOperationsQueue.json'), data: {} },
    { path: path.join(basePath, 'UserPageVisibility.json'), data: {} },
    
    // Accounts module
    { path: path.join(basePath, 'accounts', 'meta.json'), data: { module: 'accounts' } },
    { path: path.join(basePath, 'accounts', 'accounts.json'), data: {} },
    { path: path.join(basePath, 'accounts', 'CashReceipt.json'), data: {} },
    { path: path.join(basePath, 'accounts', 'Challan.json'), data: {} },
    { path: path.join(basePath, 'accounts', 'Gstledger.json'), data: {} },
    { path: path.join(basePath, 'accounts', 'Invoice.json'), data: {} },
    { path: path.join(basePath, 'accounts', 'OtherExpenses.json'), data: {} },
    { path: path.join(basePath, 'accounts', 'Purchase.json'), data: {} },
    { path: path.join(basePath, 'accounts', 'Sellchallan.json'), data: {} },
    { path: path.join(basePath, 'accounts', 'Voucher.json'), data: {} },
    
    // Customer module
    { path: path.join(basePath, 'customer', 'meta.json'), data: { module: 'customer' } },
    { path: path.join(basePath, 'customer', 'customer.json'), data: {} },
    { path: path.join(basePath, 'customer', 'CustomerDetailsTab.json'), data: {} },
    { path: path.join(basePath, 'customer', 'CustomerLedgerTab.json'), data: {} },
    { path: path.join(basePath, 'customer', 'LeadsTab.json'), data: {} },
    
    // Inventory module
    { path: path.join(basePath, 'inventory', 'meta.json'), data: { module: 'inventory' } },
    { path: path.join(basePath, 'inventory', 'inventory.json'), data: {} },
    { path: path.join(basePath, 'inventory', 'CategoryManager.json'), data: {} },
    { path: path.join(basePath, 'inventory', 'StockMovements.json'), data: {} },
    { path: path.join(basePath, 'inventory', 'StockTab.json'), data: {} },
    
    // Jobs module
    { path: path.join(basePath, 'jobs', 'meta.json'), data: { module: 'jobs' } },
    { path: path.join(basePath, 'jobs', 'jobs.json'), data: {} },
    { path: path.join(basePath, 'jobs', 'ChalanStep.json'), data: {} },
    { path: path.join(basePath, 'jobs', 'EstimateStep.json'), data: {} },
    { path: path.join(basePath, 'jobs', 'InspectionStep.json'), data: {} },
    { path: path.join(basePath, 'jobs', 'InvoiceStep.json'), data: {} },
    { path: path.join(basePath, 'jobs', 'JobSheetStep.json'), data: {} },
    
    // Labour module
    { path: path.join(basePath, 'labour', 'meta.json'), data: { module: 'labour' } },
    { path: path.join(basePath, 'labour', 'labour.json'), data: {} },
    { path: path.join(basePath, 'labour', 'LabourDetailsTab.json'), data: {} },
    { path: path.join(basePath, 'labour', 'LabourLedgerTab.json'), data: {} },
    { path: path.join(basePath, 'labour', 'LabourLedgerView.json'), data: {} },
    
    // Settings module
    { path: path.join(basePath, 'settings', 'meta.json'), data: { module: 'settings' } },
    { path: path.join(basePath, 'settings', 'settings.json'), data: {} },
    
    // Settings/General subdirectory
    { path: path.join(basePath, 'settings', 'General', 'general_setting.json'), data: {} },
    
    // Settings/My_Profile subdirectory  
    { path: path.join(basePath, 'settings', 'My_Profile', 'user_data.json'), data: {} },
    { path: path.join(basePath, 'settings', 'My_Profile', 'user_image.json'), data: {} },
    
    // Settings/Company_Master subdirectory
    { path: path.join(basePath, 'settings', 'Company_Master', 'company_master.json'), data: {} },
    
    // Settings/Rate_List_Memory subdirectory
    { path: path.join(basePath, 'settings', 'Rate_List_Memory', 'rate_list_memory.json'), data: {} },
    
    // Settings/User_Management subdirectory
    { path: path.join(basePath, 'settings', 'User_Management', 'users.json'), data: [] },
    { path: path.join(basePath, 'settings', 'User_Management', 'roles.json'), data: [] },
    { path: path.join(basePath, 'settings', 'User_Management', 'user_permissions.json'), data: [] },
    
    // Settings/Security subdirectory
    { path: path.join(basePath, 'settings', 'Security', 'Pin_time.json'), data: {} },
    
    // Settings/User_Login subdirectory
    { path: path.join(basePath, 'settings', 'User_Login', 'user_limited_access.json'), data: {} },
    
    // Settings/Legacy subdirectory (old structure for backward compatibility)
    { path: path.join(basePath, 'settings', 'Legacy', 'AboutTab.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'AuditLogsTab.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'BackupSettingsTab.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'CompanyMasterTab.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'CompanyDetails.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'GeneralSettingsTab.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'InventorySettingsTab.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'InvoiceSettingsTab.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'LedgerSettingsTab.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'MultiplierSettingsTab.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'MyProfileTab.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'RateListMemoryTab.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'SecuritySettingsTab.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'UserManagementTab.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'RateHistory.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'Templates.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'Roles.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'Permissions.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'Taxes.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'HsnCodes.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'AuditLogs.json'), data: {} },
    { path: path.join(basePath, 'settings', 'Legacy', 'Sequences.json'), data: {} },
    
    // Summary module
    { path: path.join(basePath, 'summary', 'meta.json'), data: { module: 'summary' } },
    { path: path.join(basePath, 'summary', 'summary.json'), data: {} },
    { path: path.join(basePath, 'summary', 'IncentiveSummary.json'), data: {} },
    { path: path.join(basePath, 'summary', 'PenaltyCard.json'), data: {} },
    { path: path.join(basePath, 'summary', 'SummaryDashboard.json'), data: {} },
    
    // Supplier module
    { path: path.join(basePath, 'supplier', 'meta.json'), data: { module: 'supplier' } },
    { path: path.join(basePath, 'supplier', 'supplier.json'), data: {} },
    { path: path.join(basePath, 'supplier', 'SupplierDetailsTab.json'), data: {} },
    { path: path.join(basePath, 'supplier', 'SupplierLedgerTab.json'), data: {} },
    
    // Vendors module
    { path: path.join(basePath, 'vendors', 'meta.json'), data: { module: 'vendors' } },
    { path: path.join(basePath, 'vendors', 'vendors.json'), data: {} },
    { path: path.join(basePath, 'vendors', 'VendorDetailsTab.json'), data: {} },
    { path: path.join(basePath, 'vendors', 'VendorLedgerTab.json'), data: {} }
  ];

  // Create all JSON files (skip if already exists)
  jsonFiles.forEach(({ path: filePath, data }) => {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log('📄 Created file:', filePath);
    }
  });

  console.log('✅ Directory structure initialization complete!');
};

// Initialize directory structure on startup
try {
  initializeDirectoryStructure();
} catch (error) {
  console.error('❌ Failed to initialize directory structure:', error);
}

let mainWindow;

function createWindow() {
  // Determine if in development mode
  const isDev = false; // Force production mode for testing
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'Malwa CRM v2.0.0',
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
          label: 'Refresh',
          accelerator: 'F5',
          click: async () => {
            try {
              // Execute the cache flush with toast
              const flushResult = await mainWindow.webContents.executeJavaScript(`
                (async () => {
                  try {
                    if (window.cacheManager && typeof window.cacheManager.flush === 'function') {
                      const result = await window.cacheManager.flush();
                      console.log('✅ Cache Flush completed:', result);
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
              
              if (flushResult.success) {
                console.log('✅ Cache flushed successfully');
              } else {
                console.error('❌ Cache flush failed:', flushResult.error);
              }
            } catch (error) {
              console.error('❌ Error executing cache flush:', error);
            }
          }
        },
        {
          label: 'Sync Data',
          accelerator: 'Ctrl+S',
          click: async () => {
            try {
              const uploadResult = await mainWindow.webContents.executeJavaScript(`
                (async () => {
                  try {
                    if (window.cacheManager && typeof window.cacheManager.uploadNow === 'function') {
                      const result = await window.cacheManager.uploadNow();
                      console.log('✅ Force Upload completed:', result);
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
              
              if (uploadResult.success) {
                console.log('✅ Force upload completed successfully');
              } else {
                console.error('❌ Force upload failed:', uploadResult.error);
              }
            } catch (error) {
              console.error('❌ Error executing force upload:', error);
            }
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'Ctrl+Shift+R',
          click: () => {
            mainWindow.webContents.reloadIgnoringCache();
          }
        }
            } catch (error) {
              console.error('❌ Error executing force upload:', error);
            }
          }
        }
      );

      // Add Zoom options
      menuTemplate.push(
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'Ctrl++',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom + 1);
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'Ctrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom - 1);
          }
        },
        {
          label: 'Reset Zoom',
          accelerator: 'Ctrl+0',
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          }
        }
      );

      // Add clipboard operations
      menuTemplate.push(
        { type: 'separator' },
        {
          label: 'Cut',
          role: 'cut',
          accelerator: 'Ctrl+X'
        },
        {
          label: 'Copy',
          role: 'copy',
          accelerator: 'Ctrl+C'
        },
        {
          label: 'Paste',
          role: 'paste',
          accelerator: 'Ctrl+V'
        },
        {
          label: 'Select All',
          role: 'selectAll',
          accelerator: 'Ctrl+A'
        }
      );

      // Add developer tools option in development mode
      if (isDev) {
        menuTemplate.push(
          { type: 'separator' },
          {
            label: 'Inspect Element',
            click: () => {
              mainWindow.webContents.inspectElement(x, y);
            }
          },
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

// IPC handlers for app paths and configuration
ipcMain.handle('get-app-path', () => {
  return app.getPath('userData'); // Returns C:/malwa-crm
});

ipcMain.handle('get-database-path', () => {
  return path.join(app.getPath('userData'), 'Data_base');
});

ipcMain.handle('get-custom-data-path', () => {
  return customDataPath;
});

ipcMain.handle('ensure-directory', async (event, dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return { success: true, path: dirPath };
  } catch (error) {
    console.error('Failed to create directory:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-version', () => {
  return app.getVersion();
});

ipcMain.handle('init-db-structure', async () => {
  try {
    initializeDirectoryStructure();
    return { success: true, message: 'Directory structure initialized successfully' };
  } catch (error) {
    console.error('Failed to initialize directory structure:', error);
    return { success: false, error: error.message };
  }
});

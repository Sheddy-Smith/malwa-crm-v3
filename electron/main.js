const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const isDev = !app.isPackaged;

// Database backup path - use local folder for unpacked builds
const isUnpacked = process.execPath.includes('win-unpacked') || process.execPath.includes('win-ia32-unpacked');
const MALWA_CRM_ROOT = isUnpacked 
  ? path.join(path.dirname(process.execPath), 'win-unpacked-db')
  : 'C:/malwa_crm';
const BACKUP_PATH = path.join(MALWA_CRM_ROOT, 'Data_Base');

// Global error handlers to capture crashes in the main process and make logs
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception in main process:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection in main process:', reason);
});

let mainWindow;

// Ensure single instance
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

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
      devTools: isDev,
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

  // Disallow DevTools in production
  if (!isDev) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });
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

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Enable right-click context menu
  mainWindow.webContents.on('context-menu', (event, params) => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Reload',
        click: () => mainWindow.reload(),
      },
      { type: 'separator' },
      {
        label: 'Zoom In',
        click: () => {
          const currentZoom = mainWindow.webContents.getZoomLevel();
          mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
        },
      },
      {
        label: 'Zoom Out',
        click: () => {
          const currentZoom = mainWindow.webContents.getZoomLevel();
          mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
        },
      },
      {
        label: 'Reset Zoom',
        click: () => mainWindow.webContents.setZoomLevel(0),
      },
      { type: 'separator' },
      { label: 'Cut', role: 'cut', enabled: params.editFlags.canCut },
      { label: 'Copy', role: 'copy', enabled: params.editFlags.canCopy },
      { label: 'Paste', role: 'paste', enabled: params.editFlags.canPaste },
      { label: 'Select All', role: 'selectAll' },
      ...(isDev ? [
        { type: 'separator' },
        {
          label: 'Inspect Element',
          click: () => {
            mainWindow.webContents.inspectElement(params.x, params.y);
          },
        },
      ] : []),
    ]);
    contextMenu.popup();
  });

  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Ctrl+R',
          click: () => {
            mainWindow.reload();
          },
        },
        { type: 'separator' },
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
          label: 'Zoom Level',
          submenu: [
            {
              label: '100%',
              click: () => {
                mainWindow.webContents.setZoomFactor(1.0);
              },
            },
            {
              label: '80%',
              click: () => {
                mainWindow.webContents.setZoomFactor(0.8);
              },
            },
            {
              label: '60%',
              click: () => {
                mainWindow.webContents.setZoomFactor(0.6);
              },
            },
            {
              label: '40%',
              click: () => {
                mainWindow.webContents.setZoomFactor(0.4);
              },
            },
          ],
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
        ...(isDev ? [{
          label: 'Toggle DevTools',
          accelerator: 'Ctrl+Shift+I',
          click: () => mainWindow.webContents.toggleDevTools(),
        }] : []),
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
  console.log('Is Unpacked:', isUnpacked);
  console.log('Database Root Path:', MALWA_CRM_ROOT);
  console.log('Backup Path:', BACKUP_PATH);

  // Create folder structure if it doesn't exist
  await ensureFolderStructure();
});

// ==================== File System Operations ====================

/**
 * Ensure folder structure exists at C:/malwa_crm
 */
// IPC Handlers
ipcMain.handle('get-db-config', async () => {
  return {
    isDev,
    isUnpacked,
    rootPath: MALWA_CRM_ROOT,
    backupPath: BACKUP_PATH,
    execPath: process.execPath,
  };
});

async function ensureFolderStructure() {
  try {
    await fs.mkdir(MALWA_CRM_ROOT, { recursive: true });
    await fs.mkdir(BACKUP_PATH, { recursive: true });
    await fs.mkdir(path.join(MALWA_CRM_ROOT, 'Documents'), { recursive: true });
    await fs.mkdir(path.join(MALWA_CRM_ROOT, 'Settings'), { recursive: true });
    await fs.mkdir(path.join(MALWA_CRM_ROOT, 'Logs'), { recursive: true });
    await fs.mkdir(path.join(MALWA_CRM_ROOT, 'Templates'), { recursive: true });
    await fs.mkdir(path.join(MALWA_CRM_ROOT, 'Migrations'), { recursive: true });
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

// ==================== Job Module IPC Handlers ====================

/**
 * Check if path exists and is writable
 */
ipcMain.handle('fs.checkPath', async (event, { path: checkPath }) => {
  try {
    await fs.access(checkPath, fs.constants.W_OK);
    return { exists: true, writable: true };
  } catch (error) {
    try {
      await fs.access(checkPath);
      return { exists: true, writable: false };
    } catch {
      return { exists: false, writable: false };
    }
  }
});

/**
 * Atomic file write for PDFs and photos
 */
ipcMain.handle('fs.writeAtomic', async (event, { path: filePath, dataBuffer }) => {
  try {
    // Validate path is within allowed directories
    const allowedRoot = MALWA_CRM_ROOT;
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(allowedRoot)) {
      throw new Error('Invalid path: outside allowed directory');
    }

    // Ensure directory exists
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
    
    // Write to temporary file first
    const tempPath = `${resolvedPath}.tmp`;
    await fs.writeFile(tempPath, Buffer.from(dataBuffer));
    
    // Rename to final path (atomic on most systems)
    await fs.rename(tempPath, resolvedPath);
    
    console.log('✅ File written atomically:', resolvedPath);
    return { ok: true, path: resolvedPath };
  } catch (error) {
    console.error('❌ Atomic write failed:', error);
    return { ok: false, error: error.message };
  }
});

/**
 * Export backup with filtering
 */
ipcMain.handle('backup.export', async (event, { stores, filter }) => {
  try {
    await ensureFolderStructure();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filterSuffix = filter?.jobId ? `_job_${filter.jobId}` : '';
    const fileName = `backup${filterSuffix}_${timestamp}.json`;
    const backupPath = path.join(BACKUP_PATH, fileName);

    // In a real implementation, you'd gather data from IndexedDB via renderer
    // For now, return the path structure
    const backupData = {
      timestamp: new Date().toISOString(),
      stores: stores || [],
      filter: filter || {},
      counts: {}
    };

    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
    console.log('✅ Backup exported:', backupPath);
    
    return { backupPath, counts: backupData.counts };
  } catch (error) {
    console.error('❌ Backup export failed:', error);
    throw error;
  }
});

/**
 * Import backup
 */
ipcMain.handle('backup.import', async (event, { sourcePath }) => {
  try {
    // Validate path
    const resolvedPath = path.resolve(sourcePath);
    if (!resolvedPath.startsWith(MALWA_CRM_ROOT)) {
      throw new Error('Invalid source path');
    }

    const content = await fs.readFile(resolvedPath, 'utf8');
    const backupData = JSON.parse(content);
    
    console.log('✅ Backup imported:', resolvedPath);
    return { 
      importReport: {
        success: true,
        timestamp: backupData.timestamp,
        stores: backupData.stores || [],
        recordCount: Object.keys(backupData.counts || {}).reduce((sum, key) => sum + (backupData.counts[key] || 0), 0)
      }
    };
  } catch (error) {
    console.error('❌ Backup import failed:', error);
    throw error;
  }
});

/**
 * Read file as stream for large imports
 */
ipcMain.handle('fs.readFileStream', async (event, { path: filePath }) => {
  try {
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(MALWA_CRM_ROOT)) {
      throw new Error('Invalid path');
    }

    const content = await fs.readFile(resolvedPath, 'utf8');
    console.log('✅ File stream read:', resolvedPath);
    return { streamHandle: content };
  } catch (error) {
    console.error('❌ File stream read failed:', error);
    throw error;
  }
});

// ==================== Account Module IPC Handlers ====================

/**
 * Export accounts data with filtering by period
 */
ipcMain.handle('accounts.export', async (event, { stores, period }) => {
  try {
    await ensureFolderStructure();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const periodSuffix = period ? `_${period.from}_${period.to}` : '';
    const fileName = `accounts_export${periodSuffix}_${timestamp}.json`;
    const exportPath = path.join(BACKUP_PATH, fileName);

    // In a real implementation, you'd gather data from IndexedDB via renderer
    const exportData = {
      timestamp: new Date().toISOString(),
      stores: stores || ['journal_entries', 'journal_lines', 'accounts'],
      period: period || {},
      counts: {}
    };

    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
    console.log('✅ Accounts data exported:', exportPath);
    
    return { path: exportPath, counts: exportData.counts };
  } catch (error) {
    console.error('❌ Accounts export failed:', error);
    throw error;
  }
});

/**
 * Import accounts data
 */
ipcMain.handle('accounts.import', async (event, { sourcePath }) => {
  try {
    const resolvedPath = path.resolve(sourcePath);
    if (!resolvedPath.startsWith(MALWA_CRM_ROOT)) {
      throw new Error('Invalid source path');
    }

    const content = await fs.readFile(resolvedPath, 'utf8');
    const importData = JSON.parse(content);
    
    console.log('✅ Accounts data imported:', resolvedPath);
    return { 
      importReport: {
        success: true,
        timestamp: importData.timestamp,
        stores: importData.stores || [],
        recordCount: Object.keys(importData.counts || {}).reduce((sum, key) => sum + (importData.counts[key] || 0), 0),
        errors: []
      }
    };
  } catch (error) {
    console.error('❌ Accounts import failed:', error);
    return {
      importReport: {
        success: false,
        errors: [error.message]
      }
    };
  }
});

/**
 * Generate and save GST report
 */
ipcMain.handle('accounts.exportGST', async (event, { period, data }) => {
  try {
    await ensureFolderStructure();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `gst_report_${period.from}_${period.to}_${timestamp}.json`;
    const exportPath = path.join(BACKUP_PATH, fileName);

    await fs.writeFile(exportPath, JSON.stringify(data, null, 2));
    console.log('✅ GST report exported:', exportPath);
    
    return { success: true, path: exportPath };
  } catch (error) {
    console.error('❌ GST export failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Import bank CSV for reconciliation
 */
ipcMain.handle('accounts.importBankCSV', async (event, { filePath }) => {
  try {
    const resolvedPath = path.resolve(filePath);
    const content = await fs.readFile(resolvedPath, 'utf8');
    
    // Parse CSV (basic implementation)
    const lines = content.split('\n');
    const headers = lines[0].split(',');
    const transactions = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',');
        const transaction = {};
        headers.forEach((header, index) => {
          transaction[header.trim()] = values[index]?.trim();
        });
        transactions.push(transaction);
      }
    }
    
    console.log(`✅ Bank CSV imported: ${transactions.length} transactions`);
    return { success: true, transactions };
  } catch (error) {
    console.error('❌ Bank CSV import failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Export customer data with ledger
 */
ipcMain.handle('customers.export', async (event, { customerId, customerData }) => {
  try {
    await ensureFolderStructure();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `customer_${customerId}_${timestamp}.json`;
    const exportPath = path.join(BACKUP_PATH, fileName);

    await fs.writeFile(exportPath, JSON.stringify(customerData, null, 2));
    console.log('✅ Customer data exported:', exportPath);
    
    return { success: true, path: exportPath };
  } catch (error) {
    console.error('❌ Customer export failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Export customer ledger as CSV
 */
ipcMain.handle('customers.exportLedgerCSV', async (event, { customerId, ledgerData }) => {
  try {
    await ensureFolderStructure();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `customer_ledger_${customerId}_${timestamp}.csv`;
    const exportPath = path.join(BACKUP_PATH, fileName);

    // Convert ledger to CSV
    const headers = ['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance'];
    const rows = [headers.join(',')];
    
    ledgerData.entries.forEach(entry => {
      const row = [
        entry.date,
        entry.reference,
        `"${entry.description}"`,
        entry.debit.toFixed(2),
        entry.credit.toFixed(2),
        entry.balance.toFixed(2)
      ];
      rows.push(row.join(','));
    });

    await fs.writeFile(exportPath, rows.join('\n'));
    console.log('✅ Customer ledger CSV exported:', exportPath);
    
    return { success: true, path: exportPath };
  } catch (error) {
    console.error('❌ Customer ledger CSV export failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Save customer document/attachment
 */
ipcMain.handle('customers.saveDocument', async (event, { customerId, fileName, dataBuffer }) => {
  try {
    const customerDocsPath = path.join(MALWA_CRM_ROOT, 'customers', customerId);
    await fs.mkdir(customerDocsPath, { recursive: true });
    
    const filePath = path.join(customerDocsPath, fileName);
    await fs.writeFile(filePath, Buffer.from(dataBuffer));
    
    console.log('✅ Customer document saved:', filePath);
    return { success: true, path: filePath };
  } catch (error) {
    console.error('❌ Customer document save failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Open customer document
 */
ipcMain.handle('customers.openDocument', async (event, { filePath }) => {
  try {
    const { shell } = require('electron');
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to open document:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Import customers from CSV
 */
ipcMain.handle('customers.importCSV', async (event, { filePath }) => {
  try {
    const resolvedPath = path.resolve(filePath);
    const content = await fs.readFile(resolvedPath, 'utf8');
    
    // Parse CSV
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const customers = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',');
        const customer = {};
        headers.forEach((header, index) => {
          customer[header] = values[index]?.trim();
        });
        customers.push(customer);
      }
    }
    
    console.log(`✅ Customer CSV imported: ${customers.length} customers`);
    return { success: true, customers };
  } catch (error) {
    console.error('❌ Customer CSV import failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Export all customers list as CSV
 */
ipcMain.handle('customers.exportAllCSV', async (event, { customers }) => {
  try {
    await ensureFolderStructure();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `customers_list_${timestamp}.csv`;
    const exportPath = path.join(BACKUP_PATH, fileName);

    const headers = ['ID', 'Name', 'Company', 'Phone', 'Email', 'GSTIN', 'Type', 'Outstanding'];
    const rows = [headers.join(',')];
    
    customers.forEach(cust => {
      const row = [
        cust.id,
        `"${cust.name || ''}"`,
        `"${cust.company || ''}"`,
        cust.phone || '',
        cust.email || '',
        cust.gstin || '',
        cust.type || 'customer',
        (cust.current_balance || 0).toFixed(2)
      ];
      rows.push(row.join(','));
    });

    await fs.writeFile(exportPath, rows.join('\n'));
    console.log('✅ Customers list CSV exported:', exportPath);
    
    return { success: true, path: exportPath };
  } catch (error) {
    console.error('❌ Customers list CSV export failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Export supplier data and ledger to CSV
 */
ipcMain.handle('suppliers.export', async (event, { supplierId, supplierData, ledgerData }) => {
  try {
    await ensureFolderStructure();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `supplier_${supplierId}_${timestamp}.csv`;
    const exportPath = path.join(BACKUP_PATH, fileName);

    const headers = ['Date', 'Particulars', 'Invoice No', 'Debit', 'Credit', 'Balance'];
    const rows = [
      `Supplier: ${supplierData.name || 'Unknown'}`,
      `GSTIN: ${supplierData.gstin || 'N/A'}`,
      `Phone: ${supplierData.phone || 'N/A'}`,
      '',
      headers.join(',')
    ];
    
    if (ledgerData && ledgerData.length > 0) {
      ledgerData.forEach(entry => {
        const row = [
          entry.date || '',
          `"${entry.particulars || ''}"`,
          entry.invoice_no || '',
          (entry.debit || 0).toFixed(2),
          (entry.credit || 0).toFixed(2),
          (entry.balance || 0).toFixed(2)
        ];
        rows.push(row.join(','));
      });
    }

    await fs.writeFile(exportPath, rows.join('\n'));
    console.log('✅ Supplier data exported:', exportPath);
    
    return { success: true, path: exportPath };
  } catch (error) {
    console.error('❌ Supplier export failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Save supplier document (invoice PDF, etc.)
 */
ipcMain.handle('suppliers.saveDocument', async (event, { supplierId, fileName, dataBuffer }) => {
  try {
    await ensureFolderStructure();
    const documentsFolder = path.join(MALWA_CRM_ROOT, 'Documents', 'Suppliers', String(supplierId));
    await fs.mkdir(documentsFolder, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueFileName = `${timestamp}_${fileName}`;
    const filePath = path.join(documentsFolder, uniqueFileName);

    await fs.writeFile(filePath, Buffer.from(dataBuffer));
    console.log('✅ Supplier document saved:', filePath);
    
    return { success: true, path: filePath };
  } catch (error) {
    console.error('❌ Supplier document save failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Export vendor data and ledger to CSV
 */
ipcMain.handle('vendors.export', async (event, { vendorId, vendorData, ledgerData }) => {
  try {
    await ensureFolderStructure();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `vendor_${vendorId}_${timestamp}.csv`;
    const exportPath = path.join(BACKUP_PATH, fileName);

    const headers = ['Date', 'Particulars', 'Invoice No', 'Debit', 'Credit', 'Balance'];
    const rows = [
      `Vendor: ${vendorData.name || 'Unknown'}`,
      `Service Type: ${vendorData.service_type || 'N/A'}`,
      `Phone: ${vendorData.phone || 'N/A'}`,
      '',
      headers.join(',')
    ];
    
    if (ledgerData && ledgerData.length > 0) {
      ledgerData.forEach(entry => {
        const row = [
          entry.date || '',
          `"${entry.particulars || ''}"`,
          entry.invoice_no || '',
          (entry.debit || 0).toFixed(2),
          (entry.credit || 0).toFixed(2),
          (entry.balance || 0).toFixed(2)
        ];
        rows.push(row.join(','));
      });
    }

    await fs.writeFile(exportPath, rows.join('\n'));
    console.log('✅ Vendor data exported:', exportPath);
    
    return { success: true, path: exportPath };
  } catch (error) {
    console.error('❌ Vendor export failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Save vendor document (contract, invoice, etc.)
 */
ipcMain.handle('vendors.saveDocument', async (event, { vendorId, fileName, dataBuffer }) => {
  try {
    await ensureFolderStructure();
    const documentsFolder = path.join(MALWA_CRM_ROOT, 'Documents', 'Vendors', String(vendorId));
    await fs.mkdir(documentsFolder, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueFileName = `${timestamp}_${fileName}`;
    const filePath = path.join(documentsFolder, uniqueFileName);

    await fs.writeFile(filePath, Buffer.from(dataBuffer));
    console.log('✅ Vendor document saved:', filePath);
    
    return { success: true, path: filePath };
  } catch (error) {
    console.error('❌ Vendor document save failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Export labour data and ledger to CSV
 */
ipcMain.handle('labour.export', async (event, { labourId, labourData, ledgerData }) => {
  try {
    await ensureFolderStructure();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `labour_${labourId}_${timestamp}.csv`;
    const exportPath = path.join(BACKUP_PATH, fileName);

    const headers = ['Date', 'Particulars', 'Hours', 'Debit', 'Credit', 'Balance'];
    const rows = [
      `Labour: ${labourData.name || 'Unknown'}`,
      `Skill Type: ${labourData.skill_type || 'N/A'}`,
      `Phone: ${labourData.phone || 'N/A'}`,
      `Hourly Rate: ${(labourData.hourly_rate || 0).toFixed(2)}`,
      `Daily Rate: ${(labourData.daily_rate || 0).toFixed(2)}`,
      '',
      headers.join(',')
    ];
    
    if (ledgerData && ledgerData.length > 0) {
      ledgerData.forEach(entry => {
        const row = [
          entry.date || '',
          `"${entry.particulars || ''}"`,
          (entry.hours || 0).toFixed(2),
          (entry.debit || 0).toFixed(2),
          (entry.credit || 0).toFixed(2),
          (entry.balance || 0).toFixed(2)
        ];
        rows.push(row.join(','));
      });
    }

    await fs.writeFile(exportPath, rows.join('\n'));
    console.log('✅ Labour data exported:', exportPath);
    
    return { success: true, path: exportPath };
  } catch (error) {
    console.error('❌ Labour export failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Save labour document (timesheet, contract, etc.)
 */
ipcMain.handle('labour.saveDocument', async (event, { labourId, fileName, dataBuffer }) => {
  try {
    await ensureFolderStructure();
    const documentsFolder = path.join(MALWA_CRM_ROOT, 'Documents', 'Labour', String(labourId));
    await fs.mkdir(documentsFolder, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueFileName = `${timestamp}_${fileName}`;
    const filePath = path.join(documentsFolder, uniqueFileName);

    await fs.writeFile(filePath, Buffer.from(dataBuffer));
    console.log('✅ Labour document saved:', filePath);
    
    return { success: true, path: filePath };
  } catch (error) {
    console.error('❌ Labour document save failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * =============================================================================
 * SETTINGS MODULE IPC HANDLERS
 * =============================================================================
 */

/**
 * Save company logo image
 */
ipcMain.handle('settings.saveCompanyLogo', async (event, { fileName, dataBuffer }) => {
  try {
    await ensureFolderStructure();
    const settingsFolder = path.join(MALWA_CRM_ROOT, 'Settings');
    await fs.mkdir(settingsFolder, { recursive: true });
    
    const filePath = path.join(settingsFolder, fileName);
    await fs.writeFile(filePath, Buffer.from(dataBuffer));
    console.log('✅ Company logo saved:', filePath);
    
    return { success: true, path: filePath };
  } catch (error) {
    console.error('❌ Company logo save failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Load company logo image
 */
ipcMain.handle('settings.loadCompanyLogo', async (event, { fileName }) => {
  try {
    const filePath = path.join(MALWA_CRM_ROOT, 'Settings', fileName);
    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    
    if (!exists) {
      return { success: false, error: 'Logo file not found' };
    }

    const dataBuffer = await fs.readFile(filePath);
    console.log('✅ Company logo loaded:', filePath);
    
    return { success: true, data: Array.from(dataBuffer) };
  } catch (error) {
    console.error('❌ Company logo load failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Export role templates to JSON
 */
ipcMain.handle('settings.exportRoles', async (event, { roles }) => {
  try {
    await ensureFolderStructure();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `roles_template_${timestamp}.json`;
    const exportPath = path.join(BACKUP_PATH, fileName);

    await fs.writeFile(exportPath, JSON.stringify(roles, null, 2));
    console.log('✅ Roles exported:', exportPath);
    
    return { success: true, path: exportPath };
  } catch (error) {
    console.error('❌ Roles export failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Import role templates from JSON
 */
ipcMain.handle('settings.importRoles', async (event, { filePath }) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const roles = JSON.parse(data);
    console.log('✅ Roles imported:', filePath);
    
    return { success: true, roles };
  } catch (error) {
    console.error('❌ Roles import failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Write audit log to disk
 */
ipcMain.handle('logging.writeAuditLog', async (event, { timestamp, userId, action, entity, description, metadata }) => {
  try {
    await ensureFolderStructure();
    const logsFolder = path.join(MALWA_CRM_ROOT, 'Logs');
    await fs.mkdir(logsFolder, { recursive: true });
    
    const date = new Date(timestamp).toISOString().split('T')[0];
    const logFile = path.join(logsFolder, `audit_${date}.log`);
    
    const logEntry = `[${timestamp}] USER:${userId} ACTION:${action} ENTITY:${entity} - ${description} ${JSON.stringify(metadata)}\n`;
    
    await fs.appendFile(logFile, logEntry);
    console.log('✅ Audit log written:', logFile);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Audit log write failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Rotate old log files (delete logs older than retention period)
 */
ipcMain.handle('logging.rotateLogs', async (event, { retentionDays = 90 }) => {
  try {
    const logsFolder = path.join(MALWA_CRM_ROOT, 'Logs');
    const files = await fs.readdir(logsFolder);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    let deletedCount = 0;
    
    for (const file of files) {
      if (!file.startsWith('audit_') || !file.endsWith('.log')) continue;
      
      const filePath = path.join(logsFolder, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
        deletedCount++;
        console.log('🗑️ Deleted old log:', file);
      }
    }
    
    console.log(`✅ Log rotation complete. Deleted ${deletedCount} old log files.`);
    
    return { success: true, deletedCount };
  } catch (error) {
    console.error('❌ Log rotation failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Export GST report to CSV
 */
ipcMain.handle('settings.exportGSTReport', async (event, { reportData, fromDate, toDate }) => {
  try {
    await ensureFolderStructure();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `gst_report_${fromDate}_to_${toDate}_${timestamp}.csv`;
    const exportPath = path.join(BACKUP_PATH, fileName);

    const headers = ['Date', 'Invoice No', 'Party Name', 'GSTIN', 'Taxable Amount', 'CGST', 'SGST', 'IGST', 'Total GST', 'Invoice Total'];
    const rows = [headers.join(',')];
    
    if (reportData && reportData.length > 0) {
      reportData.forEach(entry => {
        const row = [
          entry.date || '',
          `"${entry.invoice_no || ''}"`,
          `"${entry.party_name || ''}"`,
          entry.gstin || '',
          (entry.taxable_amount || 0).toFixed(2),
          (entry.cgst || 0).toFixed(2),
          (entry.sgst || 0).toFixed(2),
          (entry.igst || 0).toFixed(2),
          (entry.total_gst || 0).toFixed(2),
          (entry.invoice_total || 0).toFixed(2)
        ];
        rows.push(row.join(','));
      });
    }

    await fs.writeFile(exportPath, rows.join('\n'));
    console.log('✅ GST report exported:', exportPath);
    
    return { success: true, path: exportPath };
  } catch (error) {
    console.error('❌ GST report export failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Export settings configuration
 */
ipcMain.handle('settings.exportConfig', async (event, { config }) => {
  try {
    await ensureFolderStructure();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `settings_config_${timestamp}.json`;
    const exportPath = path.join(BACKUP_PATH, fileName);

    await fs.writeFile(exportPath, JSON.stringify(config, null, 2));
    console.log('✅ Settings configuration exported:', exportPath);
    
    return { success: true, path: exportPath };
  } catch (error) {
    console.error('❌ Settings export failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Import settings configuration
 */
ipcMain.handle('settings.importConfig', async (event, { filePath }) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const config = JSON.parse(data);
    console.log('✅ Settings configuration imported:', filePath);
    
    return { success: true, config };
  } catch (error) {
    console.error('❌ Settings import failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Save template file (PDF preview, custom template)
 */
ipcMain.handle('settings.saveTemplate', async (event, { templateName, dataBuffer }) => {
  try {
    await ensureFolderStructure();
    const templatesFolder = path.join(MALWA_CRM_ROOT, 'Templates');
    await fs.mkdir(templatesFolder, { recursive: true });
    
    const filePath = path.join(templatesFolder, templateName);
    await fs.writeFile(filePath, Buffer.from(dataBuffer));
    console.log('✅ Template saved:', filePath);
    
    return { success: true, path: filePath };
  } catch (error) {
    console.error('❌ Template save failed:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Load template file
 */
ipcMain.handle('settings.loadTemplate', async (event, { templateName }) => {
  try {
    const filePath = path.join(MALWA_CRM_ROOT, 'Templates', templateName);
    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    
    if (!exists) {
      return { success: false, error: 'Template file not found' };
    }

    const dataBuffer = await fs.readFile(filePath);
    console.log('✅ Template loaded:', filePath);
    
    return { success: true, data: Array.from(dataBuffer) };
  } catch (error) {
    console.error('❌ Template load failed:', error);
    return { success: false, error: error.message };
  }
});



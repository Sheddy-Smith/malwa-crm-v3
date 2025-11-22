// Electron IPC Handlers for Permission System
// Add these handlers to your electron/main.js file

const { ipcMain } = require('electron');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Password hashing using bcrypt (more secure than SHA-256)
ipcMain.handle('hash-password', async (event, password) => {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return { success: true, hash: hashedPassword };
  } catch (error) {
    console.error('Password hashing error:', error);
    return { success: false, error: error.message };
  }
});

// Verify password
ipcMain.handle('verify-password', async (event, { password, hash }) => {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return { success: true, isMatch };
  } catch (error) {
    console.error('Password verification error:', error);
    return { success: false, error: error.message };
  }
});

// Validate session token
ipcMain.handle('validate-session', async (event, token) => {
  try {
    // Implement your session validation logic
    // This could involve checking token expiry, signature, etc.
    const isValid = true; // Placeholder
    return { success: true, isValid };
  } catch (error) {
    console.error('Session validation error:', error);
    return { success: false, error: error.message };
  }
});

// Check permission before privileged operation
ipcMain.handle('check-permission', async (event, { userId, permissionCode }) => {
  try {
    // This would query IndexedDB through the renderer process
    // or maintain a separate permission cache in main process
    // For now, return success - implement actual check based on your needs
    return { success: true, hasPermission: true };
  } catch (error) {
    console.error('Permission check error:', error);
    return { success: false, error: error.message };
  }
});

// Export data with encryption
ipcMain.handle('export-data', async (event, { data, encrypt = false }) => {
  try {
    const { dialog } = require('electron');
    const fs = require('fs').promises;
    const path = require('path');

    // Show save dialog
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Export Data',
      defaultPath: `malwa-crm-export-${new Date().toISOString().split('T')[0]}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    let outputData = JSON.stringify(data, null, 2);

    // Optional: Encrypt data
    if (encrypt) {
      // Simple encryption example - use proper encryption in production
      const algorithm = 'aes-256-cbc';
      const key = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(outputData, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      outputData = JSON.stringify({
        encrypted: true,
        data: encrypted,
        iv: iv.toString('hex'),
        // In production, store key securely (e.g., OS keychain)
        // This is just for demonstration
        key: key.toString('hex')
      });
    }

    await fs.writeFile(filePath, outputData, 'utf8');
    
    return { success: true, filePath };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
});

// Import data with decryption
ipcMain.handle('import-data', async (event) => {
  try {
    const { dialog } = require('electron');
    const fs = require('fs').promises;

    // Show open dialog
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Import Data',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (canceled || !filePaths.length) {
      return { success: false, canceled: true };
    }

    const fileContent = await fs.readFile(filePaths[0], 'utf8');
    let data = JSON.parse(fileContent);

    // Check if data is encrypted
    if (data.encrypted) {
      const algorithm = 'aes-256-cbc';
      const key = Buffer.from(data.key, 'hex');
      const iv = Buffer.from(data.iv, 'hex');
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(data.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      data = JSON.parse(decrypted);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, error: error.message };
  }
});

// Backup to file
ipcMain.handle('backup-database', async (event, { stores }) => {
  try {
    const { dialog } = require('electron');
    const fs = require('fs').promises;
    const path = require('path');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Backup Database',
      defaultPath: `malwa-crm-backup-${timestamp}.json`,
      filters: [
        { name: 'Backup Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    // The actual data would come from the renderer
    await fs.writeFile(filePath, JSON.stringify(stores, null, 2), 'utf8');
    
    return { success: true, filePath };
  } catch (error) {
    console.error('Backup error:', error);
    return { success: false, error: error.message };
  }
});

// Restore from backup
ipcMain.handle('restore-database', async (event) => {
  try {
    const { dialog } = require('electron');
    const fs = require('fs').promises;

    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Restore Database',
      filters: [
        { name: 'Backup Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (canceled || !filePaths.length) {
      return { success: false, canceled: true };
    }

    const fileContent = await fs.readFile(filePaths[0], 'utf8');
    const backupData = JSON.parse(fileContent);

    return { success: true, data: backupData };
  } catch (error) {
    console.error('Restore error:', error);
    return { success: false, error: error.message };
  }
});

// Log audit event
ipcMain.handle('log-audit', async (event, auditData) => {
  try {
    // In a production app, you might want to store audit logs
    // in a separate, append-only file for security
    console.log('[AUDIT]', auditData);
    return { success: true };
  } catch (error) {
    console.error('Audit logging error:', error);
    return { success: false, error: error.message };
  }
});

// Custom Database Directory Operations
const fs = require('fs').promises;
const path = require('path');

const CUSTOM_DB_PATH = 'C:/malwa_crm/data-base';

// Ensure custom database directory exists
async function ensureCustomDbDirectory() {
  try {
    await fs.access(CUSTOM_DB_PATH);
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir(CUSTOM_DB_PATH, { recursive: true });
    console.log(`Created custom database directory: ${CUSTOM_DB_PATH}`);
  }
}

// Read file from custom database directory
ipcMain.handle('fs-read-file', async (event, fileName) => {
  try {
    await ensureCustomDbDirectory();
    const filePath = path.join(CUSTOM_DB_PATH, fileName);
    const content = await fs.readFile(filePath, 'utf8');
    return { success: true, data: content };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: false, error: 'File not found', notFound: true };
    }
    console.error(`Error reading file ${fileName}:`, error);
    return { success: false, error: error.message };
  }
});

// Write file to custom database directory
ipcMain.handle('fs-write-file', async (event, fileName, content) => {
  try {
    await ensureCustomDbDirectory();
    const filePath = path.join(CUSTOM_DB_PATH, fileName);
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`File saved: ${filePath}`);
    return { success: true, path: filePath };
  } catch (error) {
    console.error(`Error writing file ${fileName}:`, error);
    return { success: false, error: error.message };
  }
});

// List files in custom database directory
ipcMain.handle('fs-list-files', async (event) => {
  try {
    await ensureCustomDbDirectory();
    const files = await fs.readdir(CUSTOM_DB_PATH);
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(CUSTOM_DB_PATH, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          modified: stats.mtime,
          isDirectory: stats.isDirectory()
        };
      })
    );
    return { success: true, files: fileStats };
  } catch (error) {
    console.error('Error listing files:', error);
    return { success: false, error: error.message };
  }
});

// Delete file from custom database directory
ipcMain.handle('fs-delete-file', async (event, fileName) => {
  try {
    const filePath = path.join(CUSTOM_DB_PATH, fileName);
    await fs.unlink(filePath);
    console.log(`File deleted: ${filePath}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting file ${fileName}:`, error);
    return { success: false, error: error.message };
  }
});

// Check if file exists in custom database directory
ipcMain.handle('fs-file-exists', async (event, fileName) => {
  try {
    const filePath = path.join(CUSTOM_DB_PATH, fileName);
    await fs.access(filePath);
    return { success: true, exists: true };
  } catch (error) {
    return { success: true, exists: false };
  }
});

// Get custom database path
ipcMain.handle('fs-get-db-path', async (event) => {
  try {
    await ensureCustomDbDirectory();
    return { success: true, path: CUSTOM_DB_PATH };
  } catch (error) {
    console.error('Error getting database path:', error);
    return { success: false, error: error.message };
  }
});

// Backup entire database to custom directory
ipcMain.handle('fs-backup-database', async (event, data) => {
  try {
    await ensureCustomDbDirectory();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `malwa-crm-backup-${timestamp}.json`;
    const backupPath = path.join(CUSTOM_DB_PATH, backupFileName);
    
    // Write the main backup file
    await fs.writeFile(backupPath, JSON.stringify(data, null, 2), 'utf8');
    
    // Also write individual module files for easier access
    if (data.modules) {
      for (const [moduleName, moduleData] of Object.entries(data.modules)) {
        const moduleFileName = `${moduleName}-data.json`;
        const modulePath = path.join(CUSTOM_DB_PATH, moduleFileName);
        await fs.writeFile(modulePath, JSON.stringify(moduleData, null, 2), 'utf8');
      }
    }
    
    console.log(`Database backed up to: ${backupPath}`);
    return { 
      success: true, 
      backupPath, 
      timestamp,
      customDbPath: CUSTOM_DB_PATH 
    };
  } catch (error) {
    console.error('Error backing up database:', error);
    return { success: false, error: error.message };
  }
});

// Restore database from custom directory
ipcMain.handle('fs-restore-database', async (event, fileName) => {
  try {
    const filePath = path.join(CUSTOM_DB_PATH, fileName);
    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content);
    
    console.log(`Database restored from: ${filePath}`);
    return { success: true, data };
  } catch (error) {
    console.error(`Error restoring database from ${fileName}:`, error);
    return { success: false, error: error.message };
  }
});

// Enhanced file system handlers for new data management system

// Ensure directory exists (create if not)
ipcMain.handle('fs-ensure-dir', async (event, dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return { success: true, path: dirPath };
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    return { success: false, error: error.message };
  }
});

// Check if path exists
ipcMain.handle('fs-path-exists', async (event, filePath) => {
  try {
    await fs.access(filePath);
    return { success: true, exists: true };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: true, exists: false };
    }
    return { success: false, error: error.message };
  }
});

// Read file from any path
ipcMain.handle('fs-read-file-path', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return { success: true, data: content };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: false, error: 'File not found', notFound: true };
    }
    console.error(`Error reading file ${filePath}:`, error);
    return { success: false, error: error.message };
  }
});

// Write file to any path
ipcMain.handle('fs-write-file-path', async (event, filePath, content) => {
  try {
    // Ensure directory exists
    const dirPath = path.dirname(filePath);
    await fs.mkdir(dirPath, { recursive: true });
    
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`File saved: ${filePath}`);
    return { success: true, path: filePath };
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    return { success: false, error: error.message };
  }
});

// Get directory listing for any path
ipcMain.handle('fs-list-dir', async (event, dirPath) => {
  try {
    const files = await fs.readdir(dirPath);
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(dirPath, file);
        try {
          const stats = await fs.stat(filePath);
          return {
            name: file,
            isDirectory: stats.isDirectory(),
            size: stats.size,
            modified: stats.mtime
          };
        } catch (error) {
          return {
            name: file,
            isDirectory: false,
            size: 0,
            modified: null,
            error: error.message
          };
        }
      })
    );
    return { success: true, files: fileStats };
  } catch (error) {
    console.error(`Error listing directory ${dirPath}:`, error);
    return { success: false, error: error.message };
  }
});

module.exports = {
  CUSTOM_DB_PATH,
  ensureCustomDbDirectory
};

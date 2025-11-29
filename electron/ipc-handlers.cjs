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

// Check permission before privileged operation (ROLE-BASED)
ipcMain.handle('check-permission', async (event, { userId, permissionCode, role }) => {
  try {
    // Priority 1: If role is provided, use role-based check
    if (role) {
      // Super Admin has god mode
      if (role === 'Super Admin') {
        return { success: true, hasPermission: true };
      }
      
      // Load roles.json and check permission
      const fs = require('fs').promises;
      const rolesPath = 'C:/malwa-crm/Data_base/settings/User_Management/roles.json';
      
      try {
        const rolesData = await fs.readFile(rolesPath, 'utf8');
        const roles = JSON.parse(rolesData);
        
        if (!roles[role]) {
          console.warn('⚠️ [IPC] Role not found:', role);
          return { success: true, hasPermission: false };
        }
        
        const roleConfig = roles[role];
        
        // Check for god mode
        if (roleConfig.permissions?.godMode) {
          return { success: true, hasPermission: true };
        }
        
        // For simplified permission check, return true if role exists
        // In production, implement proper module->page->action check
        return { success: true, hasPermission: true };
      } catch (fileError) {
        console.error('❌ [IPC] Error reading roles.json:', fileError);
        return { success: false, error: 'Failed to load roles configuration' };
      }
    }
    
    // Priority 2: Fallback to userId-based check (deprecated)
    console.warn('⚠️ [IPC] check-permission called without role. Please update to role-based checks.');
    return { success: true, hasPermission: true };
  } catch (error) {
    console.error('Permission check error:', error);
    return { success: false, error: error.message };
  }
});

// NEW: Check permission by role (module, page, action)
ipcMain.handle('check-permission-by-role', async (event, { role, module, page, action }) => {
  try {
    // Super Admin has god mode
    if (role === 'Super Admin') {
      return { success: true, hasPermission: true };
    }
    
    const fs = require('fs').promises;
    const rolesPath = 'C:/malwa-crm/Data_base/settings/User_Management/roles.json';
    
    const rolesData = await fs.readFile(rolesPath, 'utf8');
    const roles = JSON.parse(rolesData);
    
    if (!roles[role]) {
      return { success: true, hasPermission: false };
    }
    
    const roleConfig = roles[role];
    
    // Check for god mode
    if (roleConfig.permissions?.godMode) {
      return { success: true, hasPermission: true };
    }
    
    // Check module -> page -> action
    const modulePerms = roleConfig.permissions?.modules?.[module];
    if (!modulePerms) {
      return { success: true, hasPermission: false };
    }
    
    const pagePerms = modulePerms.pages?.[page];
    if (!pagePerms) {
      return { success: true, hasPermission: false };
    }
    
    const hasPermission = pagePerms[action] === true;
    return { success: true, hasPermission };
  } catch (error) {
    console.error('❌ [IPC] Permission check by role error:', error);
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

const CUSTOM_DB_PATH = 'C:/malwa-crm/Data_base';

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
    if (!fileName || typeof fileName !== 'string') {
      console.warn('Invalid fileName provided for database restore');
      return { success: false, error: 'Invalid filename' };
    }
    
    const filePath = path.join(CUSTOM_DB_PATH, fileName);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      console.warn(`Database file not found: ${filePath}`);
      return { success: false, error: 'File not found' };
    }
    
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

// Check if file/folder exists
ipcMain.handle('fs-path-exists', async (event, filePath) => {
  try {
    // Check for null or invalid path
    if (!filePath || typeof filePath !== 'string') {
      return { success: false, error: 'Invalid file path provided', invalidPath: true };
    }
    
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
    // Check for null or invalid path
    if (!filePath || typeof filePath !== 'string') {
      return { success: false, error: 'Invalid file path provided', invalidPath: true };
    }
    
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
    // Check for null or invalid path
    if (!filePath || typeof filePath !== 'string') {
      return { success: false, error: 'Invalid file path provided', invalidPath: true };
    }
    
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

// === PROFILE MANAGEMENT HANDLERS ===

// Save user profile photo to file system
ipcMain.handle('profile-save-photo', async (event, { userId, photoData }) => {
  try {
    if (!userId || !photoData) {
      return { success: false, error: 'Invalid userId or photoData' };
    }

    const profileDir = path.join(CUSTOM_DB_PATH, 'profiles');
    await fs.mkdir(profileDir, { recursive: true });

    // Save photo with userId as filename
    const photoPath = path.join(profileDir, `${userId}.jpg`);
    
    // Convert base64 to buffer if needed
    let buffer;
    if (photoData.startsWith('data:image')) {
      const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      buffer = Buffer.from(photoData, 'base64');
    }

    await fs.writeFile(photoPath, buffer);
    console.log(`Profile photo saved: ${photoPath}`);

    return { 
      success: true, 
      photoPath,
      photoUrl: `file://${photoPath}`
    };
  } catch (error) {
    console.error('Error saving profile photo:', error);
    return { success: false, error: error.message };
  }
});

// Load user profile photo from file system
ipcMain.handle('profile-load-photo', async (event, userId) => {
  try {
    if (!userId) {
      return { success: false, error: 'Invalid userId' };
    }

    const profileDir = path.join(CUSTOM_DB_PATH, 'profiles');
    const photoPath = path.join(profileDir, `${userId}.jpg`);

    try {
      await fs.access(photoPath);
      const buffer = await fs.readFile(photoPath);
      const base64Data = buffer.toString('base64');
      const photoData = `data:image/jpeg;base64,${base64Data}`;

      return { 
        success: true, 
        photoData,
        photoPath 
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: true, photoData: null, notFound: true };
      }
      throw error;
    }
  } catch (error) {
    console.error('Error loading profile photo:', error);
    return { success: false, error: error.message };
  }
});

// Delete user profile photo
ipcMain.handle('profile-delete-photo', async (event, userId) => {
  try {
    if (!userId) {
      return { success: false, error: 'Invalid userId' };
    }

    const profileDir = path.join(CUSTOM_DB_PATH, 'profiles');
    const photoPath = path.join(profileDir, `${userId}.jpg`);

    try {
      await fs.unlink(photoPath);
      console.log(`Profile photo deleted: ${photoPath}`);
      return { success: true };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: true, notFound: true };
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting profile photo:', error);
    return { success: false, error: error.message };
  }
});

// Save complete profile data to file system
ipcMain.handle('profile-save-data', async (event, { userId, profileData }) => {
  try {
    if (!userId || !profileData) {
      return { success: false, error: 'Invalid userId or profileData' };
    }

    const profileDir = path.join(CUSTOM_DB_PATH, 'profiles');
    await fs.mkdir(profileDir, { recursive: true });

    const profilePath = path.join(profileDir, `${userId}-profile.json`);
    
    const dataToSave = {
      ...profileData,
      userId,
      updatedAt: new Date().toISOString()
    };

    await fs.writeFile(profilePath, JSON.stringify(dataToSave, null, 2), 'utf8');
    console.log(`Profile data saved: ${profilePath}`);

    return { 
      success: true, 
      profilePath 
    };
  } catch (error) {
    console.error('Error saving profile data:', error);
    return { success: false, error: error.message };
  }
});

// Load complete profile data from file system
ipcMain.handle('profile-load-data', async (event, userId) => {
  try {
    if (!userId) {
      return { success: false, error: 'Invalid userId' };
    }

    const profileDir = path.join(CUSTOM_DB_PATH, 'profiles');
    const profilePath = path.join(profileDir, `${userId}-profile.json`);

    try {
      const content = await fs.readFile(profilePath, 'utf8');
      const profileData = JSON.parse(content);

      return { 
        success: true, 
        profileData 
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: true, profileData: null, notFound: true };
      }
      throw error;
    }
  } catch (error) {
    console.error('Error loading profile data:', error);
    return { success: false, error: error.message };
  }
});

// Create individual user JSON file with complete credentials and permissions
ipcMain.handle('fs-create-user-file', async (event, userData) => {
  try {
    if (!userData || !userData.id) {
      return { success: false, error: 'Invalid user data or missing user ID' };
    }

    const fs = require('fs').promises;
    const path = require('path');
    
    // Create users directory in backend
    const usersDir = path.join(CUSTOM_DB_PATH, 'settings', 'User_Management', 'users');
    await fs.mkdir(usersDir, { recursive: true });

    // Create individual user JSON file
    const userFilePath = path.join(usersDir, `${userData.id}.json`);
    
    const userFileData = {
      id: userData.id,
      username: userData.username,
      name: userData.name,
      email: userData.email,
      password: userData.password, // Already hashed
      role: userData.role,
      status: userData.status,
      permissions: userData.permissions || {},
      pageAccess: userData.pageAccess || {},
      created_at: userData.created_at || new Date().toISOString(),
      last_login: userData.last_login || null,
      updated_at: userData.updated_at || new Date().toISOString(),
      login_history: [],
      settings: {
        theme: 'system',
        language: 'en',
        notifications: true
      }
    };

    await fs.writeFile(userFilePath, JSON.stringify(userFileData, null, 2), 'utf8');
    console.log(`✅ User file created: ${userFilePath}`);

    // Also update the master users.json file
    const masterUsersPath = path.join(CUSTOM_DB_PATH, 'settings', 'User_Management', 'users.json');
    let allUsers = [];
    
    try {
      const existingData = await fs.readFile(masterUsersPath, 'utf8');
      allUsers = JSON.parse(existingData);
    } catch (err) {
      // File doesn't exist yet, start with empty array
      allUsers = [];
    }

    // Add or update user in master list
    const existingIndex = allUsers.findIndex(u => u.id === userData.id);
    const userSummary = {
      id: userData.id,
      username: userData.username,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      status: userData.status,
      created_at: userData.created_at
    };

    if (existingIndex >= 0) {
      allUsers[existingIndex] = userSummary;
    } else {
      allUsers.push(userSummary);
    }

    await fs.writeFile(masterUsersPath, JSON.stringify(allUsers, null, 2), 'utf8');

    return { 
      success: true, 
      userFilePath,
      message: 'User file created successfully'
    };
  } catch (error) {
    console.error('Error creating user file:', error);
    return { success: false, error: error.message };
  }
});

// Load individual user JSON file
ipcMain.handle('fs-load-user-file', async (event, userId) => {
  try {
    if (!userId) {
      return { success: false, error: 'Invalid user ID' };
    }

    const fs = require('fs').promises;
    const path = require('path');
    
    const usersDir = path.join(CUSTOM_DB_PATH, 'settings', 'User_Management', 'users');
    const userFilePath = path.join(usersDir, `${userId}.json`);

    try {
      const content = await fs.readFile(userFilePath, 'utf8');
      const userData = JSON.parse(content);

      return { 
        success: true, 
        userData,
        filePath: userFilePath
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: true, userData: null, notFound: true };
      }
      throw error;
    }
  } catch (error) {
    console.error('Error loading user file:', error);
    return { success: false, error: error.message };
  }
});

// Update user login timestamp in their individual file
ipcMain.handle('fs-update-user-login', async (event, userId) => {
  try {
    if (!userId) {
      return { success: false, error: 'Invalid user ID' };
    }

    const fs = require('fs').promises;
    const path = require('path');
    
    const usersDir = path.join(CUSTOM_DB_PATH, 'settings', 'User_Management', 'users');
    const userFilePath = path.join(usersDir, `${userId}.json`);

    // Load existing user data
    const content = await fs.readFile(userFilePath, 'utf8');
    const userData = JSON.parse(content);

    // Update login info
    const loginTime = new Date().toISOString();
    userData.last_login = loginTime;
    userData.updated_at = loginTime;
    
    if (!userData.login_history) {
      userData.login_history = [];
    }
    userData.login_history.unshift({
      timestamp: loginTime,
      ip: 'localhost', // Can be enhanced to capture actual IP
      device: 'desktop'
    });

    // Keep only last 50 login records
    if (userData.login_history.length > 50) {
      userData.login_history = userData.login_history.slice(0, 50);
    }

    await fs.writeFile(userFilePath, JSON.stringify(userData, null, 2), 'utf8');

    return { 
      success: true,
      message: 'User login timestamp updated'
    };
  } catch (error) {
    console.error('Error updating user login:', error);
    return { success: false, error: error.message };
  }
});

// ==========================================
// WRITE-BEHIND CACHE IPC HANDLERS
// ==========================================

/**
 * Ensure cache directory exists
 */
ipcMain.handle('cache-ensure-dir', async (event, dirPath) => {
  try {
    const fs = require('fs').promises;
    await fs.mkdir(dirPath, { recursive: true });
    return { success: true, path: dirPath };
  } catch (error) {
    console.error('Cache directory creation error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Read cache file (change journal)
 */
ipcMain.handle('cache-read-file', async (event, filePath) => {
  try {
    const fs = require('fs').promises;
    const data = await fs.readFile(filePath, 'utf8');
    return { success: true, data };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: false, error: 'File not found', notFound: true };
    }
    console.error('Cache read error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Write cache file atomically
 */
ipcMain.handle('cache-write-file', async (event, filePath, data) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Ensure parent directory exists
    const dirPath = path.dirname(filePath);
    await fs.mkdir(dirPath, { recursive: true });
    
    // Write atomically using temp file + rename
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, data, 'utf8');
    await fs.rename(tempPath, filePath);
    
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Cache write error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Append to cache file (for change journal)
 */
ipcMain.handle('cache-append-file', async (event, filePath, data) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Ensure parent directory exists
    const dirPath = path.dirname(filePath);
    await fs.mkdir(dirPath, { recursive: true });
    
    // For JSON files, we need to read, parse, append, and write
    // This is atomic at the OS level
    let existingData = { changes: [], totalChanges: 0 };
    
    try {
      const existing = await fs.readFile(filePath, 'utf8');
      existingData = JSON.parse(existing);
    } catch (err) {
      // File doesn't exist yet, that's okay
    }
    
    // Parse new data
    const newData = typeof data === 'string' ? JSON.parse(data) : data;
    
    // Append changes
    if (Array.isArray(newData.changes)) {
      existingData.changes = [...(existingData.changes || []), ...newData.changes];
      existingData.totalChanges = (existingData.totalChanges || 0) + newData.changes.length;
    }
    
    existingData.lastAppend = new Date().toISOString();
    
    // Write atomically
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(existingData, null, 2), 'utf8');
    await fs.rename(tempPath, filePath);
    
    return { success: true, appended: newData.changes?.length || 0 };
  } catch (error) {
    console.error('Cache append error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Get cache file stats
 */
ipcMain.handle('cache-get-stats', async (event, filePath) => {
  try {
    const fs = require('fs').promises;
    const stats = await fs.stat(filePath);
    
    return { 
      success: true, 
      size: stats.size,
      modified: stats.mtime,
      created: stats.birthtime
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: false, error: 'File not found', notFound: true };
    }
    console.error('Cache stats error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Delete cache file
 */
ipcMain.handle('cache-delete-file', async (event, filePath) => {
  try {
    const fs = require('fs').promises;
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: true, alreadyDeleted: true };
    }
    console.error('Cache delete error:', error);
    return { success: false, error: error.message };
  }
});

// Print handlers for print functionality
ipcMain.handle('print-preview', async (event, options) => {
  try {
    const { BrowserWindow } = require('electron');
    const win = BrowserWindow.fromWebContents(event.sender);
    
    if (!win) {
      return { success: false, error: 'Window not found' };
    }

    // Print with options
    await win.webContents.print(options || {
      silent: false,
      printBackground: true,
      deviceName: '',
      margins: {
        marginType: 'default'
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Print preview error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('print-to-pdf', async (event, options) => {
  try {
    const { BrowserWindow } = require('electron');
    const win = BrowserWindow.fromWebContents(event.sender);
    
    if (!win) {
      return { success: false, error: 'Window not found' };
    }

    const pdfData = await win.webContents.printToPDF(options || {
      printBackground: true,
      marginsType: 0,
      pageSize: 'A4'
    });
    
    return { success: true, data: pdfData };
  } catch (error) {
    console.error('Print to PDF error:', error);
    return { success: false, error: error.message };
  }
});

// ==========================================
// CACHE MANAGER OPERATIONS (for Context Menu)
// ==========================================

/**
 * Trigger cache flush operation
 */
ipcMain.handle('cache-manager-flush', async (event) => {
  try {
    // Send message to renderer to execute cache flush
    const { BrowserWindow } = require('electron');
    const win = BrowserWindow.fromWebContents(event.sender);
    
    if (!win) {
      return { success: false, error: 'Window not found' };
    }

    // Execute cache flush in the renderer process context
    const result = await win.webContents.executeJavaScript(`
      (async () => {
        try {
          if (window.cacheManager && typeof window.cacheManager.flush === 'function') {
            const result = await window.cacheManager.flush();
            return { success: true, result };
          } else {
            return { success: false, error: 'Cache manager not available' };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      })()
    `);
    
    console.log('✅ Cache flush triggered from context menu:', result);
    return result;
  } catch (error) {
    console.error('Cache flush error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Trigger force upload operation
 */
ipcMain.handle('cache-manager-force-upload', async (event) => {
  try {
    // Send message to renderer to execute force upload
    const { BrowserWindow } = require('electron');
    const win = BrowserWindow.fromWebContents(event.sender);
    
    if (!win) {
      return { success: false, error: 'Window not found' };
    }

    // Execute force upload in the renderer process context
    const result = await win.webContents.executeJavaScript(`
      (async () => {
        try {
          if (window.cacheManager && typeof window.cacheManager.uploadNow === 'function') {
            const result = await window.cacheManager.uploadNow();
            return { success: true, result };
          } else {
            return { success: false, error: 'Cache manager not available' };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      })()
    `);
    
    console.log('✅ Force upload triggered from context menu:', result);
    return result;
  } catch (error) {
    console.error('Force upload error:', error);
    return { success: false, error: error.message };
  }
});



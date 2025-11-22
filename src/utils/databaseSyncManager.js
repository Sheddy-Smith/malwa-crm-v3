// Database Sync Manager for Custom File System Storage
// This module handles automatic backup/restore between IndexedDB and C:/malwa_crm/data-base

import { dbOperations } from '@/lib/db';
import { offlineDB } from '@/utils/offlineDatabase';

class DatabaseSyncManager {
  constructor() {
    this.isElectron = typeof window !== 'undefined' && window.electron && window.electron.fs;
    this.customDbPath = 'C:/malwa_crm/data-base';
    this.autoSaveInterval = 30000; // Auto-save every 30 seconds
    this.autoSaveTimer = null;
    this.lastSyncTime = null;
    this.isInitialized = false;
    
    // Store names to track for changes
    this.trackedStores = [
      'customers', 'customer_ledger_entries', 'customer_jobs', 'invoices', 'receipts', 'cash_receipts',
      'supplier_products', 'vendor_services', 'service_orders', 'vendors', 'vendor_ledger_entries',
      'labour', 'labour_ledger_entries', 'labour_attendance', 'weekly_balances',
      'suppliers', 'supplier_ledger_entries', 'inventory_categories', 'inventory_items', 'stock_movements',
      'vouchers', 'gst_ledger', 'purchase_challans', 'sell_challans', 'branches', 'profiles', 'users',
      'jobs', 'inspections', 'estimates', 'estimate_items', 'jobsheets', 'jobsheet_items', 'challans'
    ];
  }

  async initialize() {
    if (this.isInitialized || !this.isElectron) {
      return;
    }

    try {
      console.log('🔄 Initializing Database Sync Manager...');
      
      // Get custom database path
      const pathResult = await window.electron.fs.getDbPath();
      if (pathResult.success) {
        this.customDbPath = pathResult.path;
        console.log(`📁 Custom database path: ${this.customDbPath}`);
      }

      // Try to restore data from file system on startup
      await this.restoreFromFileSystem();

      // Start auto-save timer
      this.startAutoSave();

      this.isInitialized = true;
      console.log('✅ Database Sync Manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Database Sync Manager:', error);
    }
  }

  async restoreFromFileSystem() {
    if (!this.isElectron) return;

    try {
      console.log('🔄 Checking for existing data in file system...');
      
      // List available files
      const listResult = await window.electron.fs.listFiles();
      if (!listResult.success) {
        console.log('📁 No existing data files found, starting fresh');
        return;
      }

      const dataFiles = listResult.files.filter(file => 
        file.name.endsWith('-data.json') || file.name.includes('malwa-crm-backup')
      );

      if (dataFiles.length === 0) {
        console.log('📁 No backup files found in custom directory');
        return;
      }

      console.log(`📂 Found ${dataFiles.length} data files, restoring...`);

      // Try to restore from individual module files first
      for (const file of dataFiles) {
        if (file.name.endsWith('-data.json')) {
          const moduleName = file.name.replace('-data.json', '');
          await this.restoreModuleData(moduleName, file.name);
        }
      }

      // If no module files, try the latest backup file
      const backupFiles = dataFiles.filter(f => f.name.includes('malwa-crm-backup'));
      if (backupFiles.length > 0) {
        // Sort by modified date, get latest
        const latestBackup = backupFiles.sort((a, b) => 
          new Date(b.modified) - new Date(a.modified)
        )[0];
        
        await this.restoreFromBackupFile(latestBackup.name);
      }

      this.lastSyncTime = new Date();
      console.log('✅ Data restored from file system successfully');
    } catch (error) {
      console.error('❌ Error restoring from file system:', error);
    }
  }

  async restoreModuleData(moduleName, fileName) {
    try {
      const readResult = await window.electron.fs.readFile(fileName);
      if (!readResult.success) {
        console.warn(`⚠️ Failed to read ${fileName}`);
        return;
      }

      const moduleData = JSON.parse(readResult.data);
      
      // Restore data to IndexedDB stores
      if (moduleData.stores) {
        for (const [storeName, storeData] of Object.entries(moduleData.stores)) {
          if (Array.isArray(storeData) && storeData.length > 0) {
            console.log(`📦 Restoring ${storeData.length} records to ${storeName}`);
            
            // Clear existing data and restore
            await dbOperations.clear(storeName);
            
            for (const record of storeData) {
              await dbOperations.insert(storeName, record);
            }
          }
        }
      }

      console.log(`✅ Restored module: ${moduleName}`);
    } catch (error) {
      console.error(`❌ Error restoring module ${moduleName}:`, error);
    }
  }

  async restoreFromBackupFile(fileName) {
    try {
      const restoreResult = await window.electron.fs.restoreDatabase(fileName);
      if (!restoreResult.success) {
        console.warn(`⚠️ Failed to restore from ${fileName}`);
        return;
      }

      const backupData = restoreResult.data;
      
      // Restore all modules
      if (backupData.modules) {
        for (const [moduleName, moduleData] of Object.entries(backupData.modules)) {
          await this.restoreModuleData(moduleName, null, moduleData);
        }
      }

      console.log(`✅ Restored from backup file: ${fileName}`);
    } catch (error) {
      console.error(`❌ Error restoring from backup file ${fileName}:`, error);
    }
  }

  async backupToFileSystem() {
    if (!this.isElectron) return;

    try {
      console.log('💾 Backing up data to file system...');

      // Collect all data from IndexedDB
      const allData = {
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        modules: {}
      };

      // Export all tracked stores
      for (const storeName of this.trackedStores) {
        try {
          const storeData = await dbOperations.getAll(storeName);
          if (storeData && storeData.length > 0) {
            if (!allData.modules.main) {
              allData.modules.main = { stores: {} };
            }
            allData.modules.main.stores[storeName] = storeData;
          }
        } catch (error) {
          console.warn(`⚠️ Failed to backup store ${storeName}:`, error);
        }
      }

      // Save to file system
      const backupResult = await window.electron.fs.backupDatabase(allData);
      
      if (backupResult.success) {
        this.lastSyncTime = new Date();
        console.log(`✅ Data backed up successfully to: ${backupResult.backupPath}`);
        return backupResult;
      } else {
        console.error('❌ Failed to backup data:', backupResult.error);
      }
    } catch (error) {
      console.error('❌ Error backing up to file system:', error);
    }
  }

  async saveStoreData(storeName, data) {
    if (!this.isElectron) return;

    try {
      const fileName = `${storeName}-data.json`;
      const storeData = {
        storeName,
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        stores: {
          [storeName]: data
        }
      };

      const result = await window.electron.fs.writeFile(fileName, JSON.stringify(storeData, null, 2));
      if (result.success) {
        console.log(`💾 Store ${storeName} saved to file system`);
      }
    } catch (error) {
      console.error(`❌ Error saving store ${storeName}:`, error);
    }
  }

  startAutoSave() {
    if (!this.isElectron) return;

    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(async () => {
      try {
        await this.backupToFileSystem();
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
      }
    }, this.autoSaveInterval);

    console.log(`⏰ Auto-save enabled (every ${this.autoSaveInterval / 1000}s)`);
  }

  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log('⏸️ Auto-save disabled');
    }
  }

  async forceSave() {
    return await this.backupToFileSystem();
  }

  async getBackupInfo() {
    if (!this.isElectron) return null;

    try {
      const listResult = await window.electron.fs.listFiles();
      if (listResult.success) {
        return {
          customDbPath: this.customDbPath,
          lastSyncTime: this.lastSyncTime,
          files: listResult.files,
          autoSaveEnabled: !!this.autoSaveTimer,
          autoSaveInterval: this.autoSaveInterval
        };
      }
    } catch (error) {
      console.error('Error getting backup info:', error);
    }
    return null;
  }

  // Hook into database operations to trigger saves
  async onDataChanged(storeName) {
    if (this.isElectron) {
      // Debounce the save operation
      if (this.saveDebounceTimer) {
        clearTimeout(this.saveDebounceTimer);
      }
      
      this.saveDebounceTimer = setTimeout(async () => {
        try {
          const storeData = await dbOperations.getAll(storeName);
          await this.saveStoreData(storeName, storeData);
        } catch (error) {
          console.error(`Error saving ${storeName} after change:`, error);
        }
      }, 1000); // Save 1 second after last change
    }
  }

  destroy() {
    this.stopAutoSave();
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
  }
}

// Create singleton instance
const dbSyncManager = new DatabaseSyncManager();

export default dbSyncManager;
export { DatabaseSyncManager };
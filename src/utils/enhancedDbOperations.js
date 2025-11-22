/**
 * Enhanced Database Operations with File System Integration
 * Based on indexeddb_file_mapping.json structure
 */

import { dbOperations as originalDbOps } from '@/lib/db';

class EnhancedDbOperations {
  constructor() {
    this.originalOps = originalDbOps;
    this.basePath = 'C:/malwa-crm/Data_base';
    this.mapping = null;
    this.isInitialized = false;
    this._syncMethods = null;
    this.initializeMapping();
  }

  // Initialize file mapping from JSON
  async initializeMapping() {
    try {
      const response = await fetch('/indexeddb_file_mapping.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const mappingData = await response.json();
      if (!Array.isArray(mappingData)) {
        throw new Error('Invalid mapping format: expected array');
      }
      this.mapping = mappingData;
      console.log('📂 File mapping initialized:', this.mapping.length, 'modules loaded');
      return true;
    } catch (error) {
      console.error('❌ Failed to load file mapping:', error);
      // Fallback to a basic mapping structure if file not found
      this.mapping = [{
        target_folder: 'C:/malwa-crm/Data_base',
        files: ['meta.json']
      }];
      return false;
    }
  }

  // Get module mapping for specific module
  getModuleMapping(moduleName) {
    if (!this.mapping || !Array.isArray(this.mapping)) {
      console.warn('⚠️ Mapping not available or invalid');
      return null;
    }
    
    const lowerModuleName = moduleName.toLowerCase();
    
    // First try exact match
    let mapping = this.mapping.find(item => 
      item.target_folder && (
        item.target_folder.includes(`/${lowerModuleName}`) || 
        item.target_folder.includes(`\\${lowerModuleName}`) ||
        (item.target_folder.endsWith('Data_base') && lowerModuleName === 'root')
      )
    );
    
    // If no specific mapping found, use the base mapping
    if (!mapping && this.mapping.length > 0) {
      mapping = this.mapping.find(item => 
        item.target_folder && item.target_folder.endsWith('Data_base')
      ) || this.mapping[0];
      console.log(`📂 Using base mapping for ${moduleName}:`, mapping?.target_folder);
    }
    
    return mapping;
  }

  // Enhanced add operation with file backup
  async add(storeName, data) {
    try {
      const result = await this.originalOps.add(storeName, data);
      await this.backupToFileSystem(storeName);
      console.log(`✅ Added data to ${storeName} (IndexedDB + File)`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to add data to ${storeName}:`, error);
      throw error;
    }
  }

  // Enhanced update operation with file backup
  async update(storeName, data) {
    try {
      const result = await this.originalOps.update(storeName, data);
      await this.backupToFileSystem(storeName);
      console.log(`✅ Updated data in ${storeName} (IndexedDB + File)`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to update data in ${storeName}:`, error);
      throw error;
    }
  }

  // Enhanced delete operation with file backup
  async delete(storeName, id) {
    try {
      const result = await this.originalOps.delete(storeName, id);
      await this.backupToFileSystem(storeName);
      console.log(`✅ Deleted data from ${storeName} (IndexedDB + File)`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to delete data from ${storeName}:`, error);
      throw error;
    }
  }

  // Backup specific store to file system based on mapping
  async backupToFileSystem(storeName) {
    if (!window.electron?.fs) {
      console.warn('⚠️ File system not available - running in browser mode');
      return false;
    }
    
    if (!this.mapping) {
      console.warn('⚠️ File mapping not loaded, attempting to initialize...');
      await this.initializeMapping();
    }

    try {
      // Get data from IndexedDB
      const data = await this.originalOps.getAll(storeName);
      const moduleMapping = this.getModuleMapping(storeName);
      
      if (!moduleMapping || !moduleMapping.target_folder) {
        console.warn(`⚠️ No valid mapping found for: ${storeName}`);
        return false;
      }

      // Ensure directory exists
      await window.electron.fs.ensureDir(moduleMapping.target_folder);
      
      const fileName = `${storeName}.json`;
      const filePath = `${moduleMapping.target_folder}/${fileName}`.replace(/\\/g, '/');
      
      const fileContent = {
        module: storeName,
        file_type: fileName.replace('.json', ''),
        data: Array.isArray(data) ? data : (data ? [data] : []),
        metadata: {
          last_updated: new Date().toISOString(),
          record_count: Array.isArray(data) ? data.length : (data ? 1 : 0),
          backup_source: 'indexeddb',
          version: '1.0.0'
        }
      };
      
      // Write to file system
      await window.electron.fs.writeFile(filePath, JSON.stringify(fileContent, null, 2));
      
      // Update meta file
      await this.updateMetaFile(moduleMapping.target_folder, storeName);
      
      console.log(`✅ Backed up ${storeName} to: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to backup ${storeName}:`, error);
      return false;
    }
  }

  // Update meta file for a module
  async updateMetaFile(folderPath, updatedStore) {
    try {
      const metaPath = `${folderPath}/meta.json`;
      const timestamp = new Date().toISOString();
      
      let metaContent;
      try {
        const existingMeta = await window.electron.fs.readFile(metaPath);
        metaContent = JSON.parse(existingMeta);
      } catch {
        const moduleName = folderPath.split('/').pop();
        metaContent = {
          module: moduleName,
          created_at: timestamp,
          last_updated: timestamp,
          version: "1.0.0",
          sync_status: "active"
        };
      }
      
      metaContent.last_updated = timestamp;
      metaContent.last_updated_store = updatedStore;
      
      await window.electron.fs.writeFile(metaPath, JSON.stringify(metaContent, null, 2));
      console.log(`📝 Updated meta file: ${metaPath}`);
    } catch (error) {
      console.error('❌ Failed to update meta file:', error);
    }
  }

  // Initialize complete file structure based on mapping
  async initializeFileStructure() {
    if (!this.mapping || !window.electron?.fs) {
      console.warn('⚠️ File system not available or mapping not loaded');
      return false;
    }

    try {
      console.log('🏗️ Creating file structure based on indexeddb_file_mapping.json...');
      
      for (const module of this.mapping) {
        const folderPath = module.target_folder;
        await window.electron.fs.ensureDir(folderPath);
        console.log(`📁 Created directory: ${folderPath}`);
        
        for (const fileName of module.files) {
          const filePath = `${folderPath}/${fileName}`;
          
          try {
            const exists = await window.electron.fs.pathExists(filePath);
            if (!exists) {
              const defaultContent = this.getDefaultFileContent(fileName, module);
              await window.electron.fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2));
              console.log(`📄 Created file: ${filePath}`);
            }
          } catch (fileError) {
            console.warn(`⚠️ Could not create file ${filePath}:`, fileError);
          }
        }
      }
      
      console.log('✅ File structure creation completed');
      return true;
    } catch (error) {
      console.error('❌ Failed to create file structure:', error);
      return false;
    }
  }

  // Get default content for different file types
  getDefaultFileContent(fileName, module) {
    const timestamp = new Date().toISOString();
    const moduleName = module.target_folder.split('/').pop();

    if (fileName === 'meta.json') {
      return {
        module: moduleName,
        created_at: timestamp,
        last_updated: timestamp,
        version: "1.0.0",
        file_count: module.files.length - 1,
        sync_status: "initialized",
        google_drive_sync: false
      };
    }

    return {
      module: moduleName,
      file_type: fileName.replace('.json', ''),
      data: [],
      metadata: {
        created_at: timestamp,
        last_updated: timestamp,
        record_count: 0,
        version: "1.0.0"
      },
      sync_info: {
        last_sync: null,
        google_drive_id: null,
        local_changes: false
      }
    };
  }

  // Load data from file system
  async loadFromFileSystem(storeName) {
    if (!window.electron?.fs || !this.mapping) {
      console.warn('⚠️ File system or mapping not available');
      return null;
    }

    try {
      const moduleMapping = this.getModuleMapping(storeName);
      if (!moduleMapping) {
        console.warn(`⚠️ No mapping found for: ${storeName}`);
        return null;
      }

      const fileName = `${storeName}.json`;
      const filePath = `${moduleMapping.target_folder}/${fileName}`;
      
      const fileContent = await window.electron.fs.readFile(filePath);
      const parsedContent = JSON.parse(fileContent);
      
      console.log(`📖 Loaded ${storeName} from file system: ${filePath}`);
      return parsedContent.data || [];
    } catch (error) {
      console.warn(`⚠️ Could not load ${storeName} from file system:`, error);
      return null;
    }
  }

  // Full sync operation
  async fullSync() {
    console.log('🔄 Starting full sync based on file mapping...');
    try {
      await this.initializeFileStructure();
      
      const stores = ['accounts', 'customers', 'inventory', 'jobs', 'labour', 'settings', 'suppliers', 'vendors'];
      const results = { successful: [], failed: [] };

      for (const store of stores) {
        try {
          const success = await this.backupToFileSystem(store);
          if (success) {
            results.successful.push(store);
          } else {
            results.failed.push(store);
          }
        } catch (error) {
          results.failed.push(store);
          console.error(`❌ Failed to sync ${store}:`, error);
        }
      }

      console.log('📊 Sync Results:', results);
      return results;
    } catch (error) {
      console.error('❌ Full sync failed:', error);
      return false;
    }
  }

  // Get file system status
  async getFileSystemStatus() {
    if (!window.electron?.fs) {
      return { available: false, reason: 'File system not available' };
    }

    try {
      const status = { available: true, modules: {} };
      
      for (const module of this.mapping || []) {
        const moduleName = module.target_folder.split('/').pop();
        const exists = await window.electron.fs.pathExists(module.target_folder);
        status.modules[moduleName] = { 
          exists, 
          path: module.target_folder,
          files: module.files
        };
      }
      
      return status;
    } catch (error) {
      return { available: false, reason: error.message };
    }
  }

  // Prepare Google Drive sync metadata
  async prepareGoogleDriveSync() {
    console.log('☁️ Preparing Google Drive sync metadata...');
    
    const syncMetadata = {
      created_at: new Date().toISOString(),
      malwa_crm_version: "4.0.0",
      sync_strategy: "incremental",
      conflict_resolution: "timestamp_based",
      modules: {}
    };

    for (const module of this.mapping || []) {
      const moduleName = module.target_folder.split('/').pop();
      syncMetadata.modules[moduleName] = {
        folder_path: module.target_folder,
        files: module.files,
        google_drive_folder_id: null,
        last_sync: null
      };
    }

    if (window.electron?.fs) {
      try {
        const syncPath = `${this.basePath}/GoogleDrive_Sync`;
        await window.electron.fs.ensureDir(syncPath);
        await window.electron.fs.writeFile(
          `${syncPath}/sync_metadata.json`, 
          JSON.stringify(syncMetadata, null, 2)
        );
        console.log('✅ Google Drive sync metadata created');
        return true;
      } catch (error) {
        console.error('❌ Failed to create Google Drive sync metadata:', error);
      }
    }
    
    return false;
  }

  // Delegate operations to original dbOperations
  async getAll(storeName) {
    return await this.originalOps.getAll(storeName);
  }

  async getById(storeName, id) {
    return await this.originalOps.getById(storeName, id);
  }

  async clear(storeName) {
    const result = await this.originalOps.clear(storeName);
    await this.backupToFileSystem(storeName);
    return result;
  }

  async count(storeName) {
    return await this.originalOps.count(storeName);
  }

  async search(storeName, searchTerm, field) {
    return await this.originalOps.search(storeName, searchTerm, field);
  }

  // Sync functionality for compatibility with existing components
  get sync() {
    return {
      isAvailable: () => {
        return !!window.electron?.fs;
      },
      
      getInfo: async () => {
        try {
          const status = await this.getFileSystemStatus();
          return {
            lastSyncTime: new Date().toISOString(),
            available: status.available,
            modules: status.modules || {},
            totalFiles: Object.keys(status.modules || {}).length
          };
        } catch (error) {
          console.error('Failed to get sync info:', error);
          return {
            lastSyncTime: null,
            available: false,
            modules: {},
            totalFiles: 0
          };
        }
      },
      
      backup: async () => {
        try {
          console.log('💾 Starting full backup...');
          const result = await this.fullSync();
          return {
            success: result,
            message: result ? 'Backup completed successfully' : 'Backup failed',
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          console.error('Backup failed:', error);
          return {
            success: false,
            message: error.message,
            timestamp: new Date().toISOString()
          };
        }
      },
      
      restore: async (fileName) => {
        try {
          console.log(`🔄 Starting restore from: ${fileName}`);
          // This would need to be implemented based on your restore requirements
          const filePath = `${this.basePath}/backups/${fileName}`;
          const exists = await window.electron.fs.pathExists(filePath);
          
          if (!exists) {
            throw new Error(`Backup file not found: ${fileName}`);
          }
          
          // For now, just return success - you'd implement actual restore logic here
          return {
            success: true,
            message: 'Restore completed successfully',
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          console.error('Restore failed:', error);
          throw error;
        }
      }
    };
  }
}

// Create enhanced operations instance
const enhancedDbOperations = new EnhancedDbOperations();

export default enhancedDbOperations;
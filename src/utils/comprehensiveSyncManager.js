/**
 * Comprehensive Sync Manager for Malwa CRM
 * Handles IndexedDB to File System sync based on indexeddb_file_mapping.json
 * Integrates with Google Drive sync preparation
 */

import enhancedDbOperations from './enhancedDbOperations';
import pageDataManager from './pageDataManager';

class ComprehensiveSyncManager {
  constructor() {
    this.dbOps = enhancedDbOperations;
    this.pageManager = pageDataManager;
    this.basePath = 'C:/malwa-crm/Data_base';
    this.syncInProgress = false;
    this.lastSyncTime = null;
  }

  // Main sync initialization
  async initializeSync() {
    try {
      console.log('🚀 Initializing Comprehensive Sync Manager...');
      
      if (!window.electron?.fs) {
        console.warn('⚠️ File system not available - running in browser mode');
        return {
          success: false,
          mode: 'browser',
          message: 'File system sync not available in browser mode'
        };
      }

      // Step 1: Initialize file structure based on mapping
      console.log('📁 Step 1: Creating file structure...');
      const structureCreated = await this.dbOps.initializeFileStructure();
      
      if (!structureCreated) {
        throw new Error('Failed to create file structure');
      }

      // Step 2: Initial sync of existing data
      console.log('🔄 Step 2: Syncing existing IndexedDB data...');
      const syncResult = await this.dbOps.fullSync();
      
      // Step 3: Initialize page-based structure
      console.log('📄 Step 3: Setting up page-based organization...');
      const pageStructure = await this.pageManager.initializePageStructure();
      
      // Step 4: Prepare Google Drive sync
      console.log('☁️ Step 4: Preparing Google Drive sync...');
      const googleDriveReady = await this.dbOps.prepareGoogleDriveSync();
      
      // Step 5: Create system status file
      await this.createSystemStatusFile(syncResult, pageStructure, googleDriveReady);
      
      this.lastSyncTime = new Date().toISOString();
      
      console.log('✅ Comprehensive sync initialization completed!');
      
      return {
        success: true,
        mode: 'electron',
        structure_created: structureCreated,
        data_synced: syncResult,
        page_structure: pageStructure,
        google_drive_ready: googleDriveReady,
        last_sync: this.lastSyncTime
      };
      
    } catch (error) {
      console.error('❌ Sync initialization failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create system status file
  async createSystemStatusFile(syncResult, pageStructure, googleDriveReady) {
    try {
      const systemStatus = {
        malwa_crm_version: "4.0.0",
        sync_system_version: "1.0.0",
        initialized_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        
        file_structure: {
          status: "active",
          base_path: this.basePath,
          mapping_file: "indexeddb_file_mapping.json"
        },
        
        data_sync: {
          status: syncResult ? "completed" : "partial",
          successful_stores: syncResult?.successful || [],
          failed_stores: syncResult?.failed || []
        },
        
        page_structure: {
          status: pageStructure ? "active" : "inactive",
          page_based_organization: true
        },
        
        google_drive_sync: {
          status: googleDriveReady ? "prepared" : "not_ready",
          metadata_created: googleDriveReady,
          external_sync_ready: true
        },
        
        features: {
          role_based_access: true,
          multi_user_workspaces: true,
          page_based_storage: true,
          automatic_backup: true,
          google_drive_integration: true
        }
      };

      await window.electron.fs.writeFile(
        `${this.basePath}/system_status.json`,
        JSON.stringify(systemStatus, null, 2)
      );
      
      console.log('📊 System status file created');
    } catch (error) {
      console.error('❌ Failed to create system status file:', error);
    }
  }

  // Real-time sync for data changes
  async onDataChange(storeName, operation = 'update') {
    if (this.syncInProgress) {
      console.log('🔄 Sync already in progress, queuing...');
      return;
    }

    try {
      this.syncInProgress = true;
      console.log(`🔄 Syncing ${storeName} after ${operation}...`);
      
      // Sync to file system
      const syncSuccess = await this.dbOps.backupToFileSystem(storeName);
      
      if (syncSuccess) {
        // Update system status
        await this.updateSystemStatus(storeName, operation);
        console.log(`✅ Real-time sync completed for ${storeName}`);
      }
      
    } catch (error) {
      console.error(`❌ Real-time sync failed for ${storeName}:`, error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Update system status after changes
  async updateSystemStatus(storeName, operation) {
    try {
      const statusPath = `${this.basePath}/system_status.json`;
      
      let systemStatus;
      try {
        const existingStatus = await window.electron.fs.readFile(statusPath);
        systemStatus = JSON.parse(existingStatus);
      } catch {
        return; // If status file doesn't exist, skip update
      }

      systemStatus.last_updated = new Date().toISOString();
      systemStatus.last_operation = {
        store: storeName,
        operation: operation,
        timestamp: new Date().toISOString()
      };

      await window.electron.fs.writeFile(statusPath, JSON.stringify(systemStatus, null, 2));
      
    } catch (error) {
      console.error('❌ Failed to update system status:', error);
    }
  }

  // Get comprehensive sync status
  async getSyncStatus() {
    try {
      // Get file system status
      const fileSystemStatus = await this.dbOps.getFileSystemStatus();
      
      // Get page sync status  
      const pageStatus = await this.pageManager.getPageSyncStatus();
      
      // Get system status
      let systemStatus = null;
      try {
        const statusFile = await window.electron.fs.readFile(`${this.basePath}/system_status.json`);
        systemStatus = JSON.parse(statusFile);
      } catch {
        systemStatus = { status: 'not_initialized' };
      }

      return {
        overall_status: fileSystemStatus.available ? 'active' : 'inactive',
        file_system: fileSystemStatus,
        page_system: pageStatus,
        system_info: systemStatus,
        last_sync: this.lastSyncTime,
        sync_in_progress: this.syncInProgress
      };
      
    } catch (error) {
      console.error('❌ Failed to get sync status:', error);
      return {
        overall_status: 'error',
        error: error.message
      };
    }
  }

  // Manual full sync operation
  async performFullSync() {
    if (this.syncInProgress) {
      console.log('🔄 Sync already in progress...');
      return false;
    }

    try {
      this.syncInProgress = true;
      console.log('🔄 Starting manual full sync...');
      
      // Sync all page data
      const pageSync = await this.pageManager.syncAllPageData();
      
      // Update last sync time
      this.lastSyncTime = new Date().toISOString();
      
      // Update system status
      await this.updateSystemStatus('all_stores', 'full_sync');
      
      console.log('✅ Manual full sync completed');
      return pageSync;
      
    } catch (error) {
      console.error('❌ Manual full sync failed:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Create user workspace with full integration
  async createUserWorkspace(userData) {
    try {
      console.log(`👤 Creating integrated workspace for: ${userData.username}`);
      
      // Create page-based workspace
      const workspaceResult = await this.pageManager.createUserWorkspace(userData);
      
      if (workspaceResult.success) {
        // Log user creation in system
        await this.logUserWorkspaceCreation(userData, workspaceResult);
        
        console.log(`✅ User workspace created successfully for ${userData.username}`);
        return workspaceResult;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to create user workspace:', error);
      return false;
    }
  }

  // Log user workspace creation
  async logUserWorkspaceCreation(userData, workspaceResult) {
    try {
      const logEntry = {
        action: 'user_workspace_created',
        user_id: userData.id,
        username: userData.username,
        role: userData.role,
        workspace_path: workspaceResult.workspace_path,
        accessible_pages: workspaceResult.accessible_pages,
        created_at: new Date().toISOString(),
        created_by: 'system'
      };

      const logsPath = `${this.basePath}/system_logs.json`;
      
      let logs = [];
      try {
        const existingLogs = await window.electron.fs.readFile(logsPath);
        logs = JSON.parse(existingLogs);
      } catch {
        // First log entry
      }

      logs.push(logEntry);
      
      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs = logs.slice(-1000);
      }

      await window.electron.fs.writeFile(logsPath, JSON.stringify(logs, null, 2));
      
    } catch (error) {
      console.error('❌ Failed to log user workspace creation:', error);
    }
  }

  // Export all data for backup
  async exportAllData() {
    try {
      console.log('📤 Exporting all data for backup...');
      
      const exportData = {
        export_info: {
          created_at: new Date().toISOString(),
          malwa_crm_version: "4.0.0",
          export_type: "complete_backup"
        },
        modules: {}
      };

      const stores = ['accounts', 'customers', 'inventory', 'jobs', 'labour', 'settings', 'suppliers', 'vendors', 'summary'];
      
      for (const store of stores) {
        try {
          const storeData = await this.dbOps.getAll(store);
          exportData.modules[store] = {
            record_count: storeData.length,
            data: storeData,
            exported_at: new Date().toISOString()
          };
        } catch (error) {
          console.error(`❌ Failed to export ${store}:`, error);
          exportData.modules[store] = {
            record_count: 0,
            data: [],
            error: error.message
          };
        }
      }

      // Save export file
      const exportPath = `${this.basePath}/exports/backup_${Date.now()}.json`;
      await window.electron.fs.ensureDir(`${this.basePath}/exports`);
      await window.electron.fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
      
      console.log(`✅ Data exported to: ${exportPath}`);
      return {
        success: true,
        export_path: exportPath,
        modules: Object.keys(exportData.modules),
        total_records: Object.values(exportData.modules).reduce((sum, module) => sum + module.record_count, 0)
      };
      
    } catch (error) {
      console.error('❌ Data export failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get system health check
  async getSystemHealth() {
    try {
      const status = await this.getSyncStatus();
      
      const health = {
        overall: 'healthy',
        checks: {
          file_system: status.file_system?.available ? 'pass' : 'fail',
          page_system: status.page_system?.available ? 'pass' : 'fail',
          sync_system: status.overall_status === 'active' ? 'pass' : 'fail'
        },
        recommendations: []
      };

      // Add recommendations based on status
      if (!status.file_system?.available) {
        health.recommendations.push('Initialize file system structure');
        health.overall = 'needs_attention';
      }

      if (status.sync_in_progress) {
        health.recommendations.push('Sync operation in progress');
      }

      if (status.last_sync) {
        const lastSync = new Date(status.last_sync);
        const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceSync > 24) {
          health.recommendations.push('Consider running manual sync - last sync over 24 hours ago');
          health.overall = 'needs_attention';
        }
      }

      return health;
    } catch (error) {
      return {
        overall: 'error',
        error: error.message,
        checks: {},
        recommendations: ['System health check failed - investigate errors']
      };
    }
  }
}

// Create singleton instance
const comprehensiveSyncManager = new ComprehensiveSyncManager();

export default comprehensiveSyncManager;
import { indexedDB, STORES } from './indexedDB';
import { v4 as uuidv4 } from 'uuid';

class SyncManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.isSyncing = false;
    this.syncInterval = null;
    this.listeners = new Set();

    window.addEventListener('online', () => this.handleOnlineStatus(true));
    window.addEventListener('offline', () => this.handleOnlineStatus(false));
  }

  handleOnlineStatus(online) {
    this.isOnline = online;
    this.notifyListeners();

    if (online) {
      console.log('🟢 Online - Starting sync...');
      this.syncAll();
    } else {
      console.log('🔴 Offline - Queue mode activated');
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach((callback) => callback(this.isOnline));
  }

  async addToSyncQueue(action, storeName, data) {
    const queueItem = {
      id: uuidv4(),
      action,
      storeName,
      data,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retries: 0,
    };

    // Persist queue item locally. In offline-first desktop mode we do not
    // attempt to send this to any remote server. The queue is kept for
    // future use or manual export/import.
    await indexedDB.put(STORES.syncQueue, queueItem);
    console.log('📝 Added to local sync queue:', queueItem);
  }

  async processSyncQueue() {
    if (this.isSyncing) return;

    this.isSyncing = true;
    const queue = await indexedDB.getAll(STORES.syncQueue);
    const pendingItems = queue.filter((item) => item.status === 'pending');

    console.log(`🔄 Processing ${pendingItems.length} pending sync items...`);

    for (const item of pendingItems) {
      // In local-only mode we'll mark items as processed locally. If you
      // want to export or replay them later, they remain in the DB.
      try {
        console.log('Processing local queue item (no remote):', item);
        item.status = 'processed';
        await indexedDB.put(STORES.syncQueue, item);
      } catch (error) {
        console.error('Local queue processing error:', error);
        item.retries++;
        item.status = item.retries > 3 ? 'failed' : 'pending';
        await indexedDB.put(STORES.syncQueue, item);
      }
    }

    this.isSyncing = false;
    console.log('✅ Sync queue processed');
  }

  // Remote sync disabled in local-only desktop build. The syncItem function
  // is intentionally omitted to avoid any network calls.

  getSupabaseTableName(storeName) {
    const mapping = {
      customers: 'customers',
      vendors: 'vendors',
      suppliers: 'suppliers',
      labours: 'labours',
      inventory: 'inventory',
      jobs: 'jobs',
      ledgerEntries: 'ledger_entries',
      settings: 'settings',
      companies: 'companies',
    };
    return mapping[storeName] || storeName;
  }

  async syncFromSupabase(userId) {
    // Remote sync is disabled in the local-only Electron build. If you need
    // to import data from a remote source, implement an import feature that
    // reads a file and calls `indexedDB.bulkPut(...)`.
    console.log('Remote sync is disabled in local-only mode');
  }

  getStoreNameFromTable(tableName) {
    const mapping = {
      customers: 'customers',
      vendors: 'vendors',
      suppliers: 'suppliers',
      labours: 'labours',
      inventory: 'inventory',
      jobs: 'jobs',
      ledger_entries: 'ledgerEntries',
      settings: 'settings',
      companies: 'companies',
    };
    return mapping[tableName] || tableName;
  }

  async syncAll() {
    if (!this.isOnline) return;

    await this.processSyncQueue();
  }

  async clearLocalData() {
    console.log('🗑️ Clearing local IndexedDB data...');
    await indexedDB.clearAll();
    console.log('✅ Local data cleared');
  }

  startAutoSync(intervalMs = 30000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.processSyncQueue();
      }
    }, intervalMs);

    console.log(`🔄 Auto-sync started (every ${intervalMs / 1000}s)`);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Auto-sync stopped');
    }
  }
}

const syncManager = new SyncManager();

export { syncManager };
export default syncManager;

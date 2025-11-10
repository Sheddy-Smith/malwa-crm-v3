import { indexedDB, STORES } from './indexedDB';
import { syncManager } from './syncManager';

class OfflineDataManager {
  constructor() {
    this.isOnline = navigator.onLine;
  }

  async saveData(storeName, data, userId) {
    try {
      await indexedDB.put(storeName, { ...data, user_id: userId });

      // In local-only mode we only persist locally. We keep the queue item
      // for bookkeeping but do not attempt remote sync.
      await syncManager.addToSyncQueue('update', storeName, { ...data, user_id: userId });

      return { success: true };
    } catch (error) {
      console.error('Save data error:', error);
      return { success: false, error: error.message };
    }
  }

  async createData(storeName, data, userId) {
    try {
      const dataWithUser = { ...data, user_id: userId };
      await indexedDB.put(storeName, dataWithUser);
      await syncManager.addToSyncQueue('create', storeName, dataWithUser);
      return { success: true, data: dataWithUser };
    } catch (error) {
      console.error('Create data error:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteData(storeName, id, userId) {
    try {
      await indexedDB.delete(storeName, id);
      await syncManager.addToSyncQueue('delete', storeName, { id, user_id: userId });
      return { success: true };
    } catch (error) {
      console.error('Delete data error:', error);
      return { success: false, error: error.message };
    }
  }

  async getData(storeName, userId) {
    try {
      // Always read from local IndexedDB in the local-only desktop build.
      const data = await indexedDB.getByIndex(storeName, 'user_id', userId);
      return data || [];
    } catch (error) {
      console.error('Get data error:', error);
      const localData = await indexedDB.getByIndex(storeName, 'user_id', userId);
      return localData || [];
    }
  }

  async syncToSupabase(storeName, data, action, userId) {
    // Remote sync disabled in local-only mode. The function remains to avoid
    // breaking callers but simply returns a successful response.
    console.log('syncToSupabase called but remote sync is disabled in local-only mode');
    return { success: false, error: 'Remote sync disabled' };
  }

  async getById(storeName, id) {
    try {
      const data = await indexedDB.getById(storeName, id);
      return data;
    } catch (error) {
      console.error('Get by ID error:', error);
      return null;
    }
  }

  async syncAll(userId) {
    if (!navigator.onLine) {
      console.log('⚠️ Offline - Cannot sync all data');
      return { success: false, message: 'Offline' };
    }

    try {
      await syncManager.syncFromSupabase(userId);
      return { success: true };
    } catch (error) {
      console.error('Sync all error:', error);
      return { success: false, error: error.message };
    }
  }
}

const offlineDataManager = new OfflineDataManager();

export { offlineDataManager };
export default offlineDataManager;

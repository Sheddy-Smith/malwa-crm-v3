import { indexedDB, STORES } from './indexedDB';
import { v4 as uuidv4 } from 'uuid';

class LocalDatabase {
  constructor() {
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    await indexedDB.init();
    this.initialized = true;
    console.log('✅ Local database initialized');
  }

  async createRecord(storeName, data) {
    await this.init();
    const record = {
      ...data,
      id: data.id || uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await indexedDB.put(storeName, record);
    return record;
  }

  async updateRecord(storeName, id, updates) {
    await this.init();
    const existing = await indexedDB.getById(storeName, id);
    if (!existing) {
      throw new Error('Record not found');
    }
    const updated = {
      ...existing,
      ...updates,
      id,
      updated_at: new Date().toISOString(),
    };
    await indexedDB.put(storeName, updated);
    return updated;
  }

  async deleteRecord(storeName, id) {
    await this.init();
    await indexedDB.delete(storeName, id);
    return true;
  }

  async getRecord(storeName, id) {
    await this.init();
    return await indexedDB.getById(storeName, id);
  }

  async getAllRecords(storeName, userId = null) {
    await this.init();
    if (userId) {
      return await indexedDB.getByIndex(storeName, 'user_id', userId);
    }
    return await indexedDB.getAll(storeName);
  }

  async queryRecords(storeName, filterFn) {
    await this.init();
    const allRecords = await indexedDB.getAll(storeName);
    return filterFn ? allRecords.filter(filterFn) : allRecords;
  }

  async countRecords(storeName) {
    await this.init();
    return await indexedDB.count(storeName);
  }

  async clearStore(storeName) {
    await this.init();
    return await indexedDB.clear(storeName);
  }

  async bulkCreate(storeName, records) {
    await this.init();
    const timestampedRecords = records.map(record => ({
      ...record,
      id: record.id || uuidv4(),
      created_at: record.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    return await indexedDB.bulkPut(storeName, timestampedRecords);
  }
}

const localDB = new LocalDatabase();

export { localDB, STORES };
export default localDB;

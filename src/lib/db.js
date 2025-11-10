const DB_NAME = 'malwa_erp_db';
const DB_VERSION = 1;

let db = null;

const STORES = {
  customers: 'id',
  customer_ledger_entries: 'id',
  customer_jobs: 'id',
  invoices: 'id',
  receipts: 'id',
  vendors: 'id',
  vendor_ledger_entries: 'id',
  labour: 'id',
  labour_ledger_entries: 'id',
  suppliers: 'id',
  supplier_ledger_entries: 'id',
  inventory_categories: 'id',
  inventory_items: 'id',
  stock_movements: 'id',
  vouchers: 'id',
  gst_ledger: 'id',
  purchase_challans: 'id',
  sell_challans: 'id',
  branches: 'id',
  profiles: 'id',
  users: 'id'
};

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      Object.entries(STORES).forEach(([storeName, keyPath]) => {
        if (!database.objectStoreNames.contains(storeName)) {
          const objectStore = database.createObjectStore(storeName, {
            keyPath,
            autoIncrement: false
          });

          if (storeName === 'customers') {
            objectStore.createIndex('phone', 'phone', { unique: false });
            objectStore.createIndex('name', 'name', { unique: false });
          } else if (storeName === 'customer_ledger_entries') {
            objectStore.createIndex('customer_id', 'customer_id', { unique: false });
            objectStore.createIndex('entry_date', 'entry_date', { unique: false });
          } else if (storeName === 'customer_jobs') {
            objectStore.createIndex('customer_id', 'customer_id', { unique: false });
            objectStore.createIndex('job_no', 'job_no', { unique: true });
            objectStore.createIndex('status', 'status', { unique: false });
          } else if (storeName === 'invoices') {
            objectStore.createIndex('customer_id', 'customer_id', { unique: false });
            objectStore.createIndex('invoice_no', 'invoice_no', { unique: true });
          } else if (storeName === 'vendors') {
            objectStore.createIndex('code', 'code', { unique: true });
          } else if (storeName === 'labour') {
            objectStore.createIndex('code', 'code', { unique: true });
          } else if (storeName === 'suppliers') {
            objectStore.createIndex('code', 'code', { unique: true });
          } else if (storeName === 'inventory_items') {
            objectStore.createIndex('code', 'code', { unique: true });
            objectStore.createIndex('category_id', 'category_id', { unique: false });
          } else if (storeName === 'users') {
            objectStore.createIndex('email', 'email', { unique: true });
          }
        }
      });
    };
  });
};

const getDB = async () => {
  if (!db) {
    await initDB();
  }
  return db;
};

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const dbOperations = {
  async insert(storeName, data) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const record = {
        ...data,
        id: data.id || generateUUID(),
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString()
      };

      const request = store.add(record);

      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  },

  async update(storeName, id, data) {
    const database = await getDB();
    return new Promise(async (resolve, reject) => {
      const transaction = database.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (!record) {
          reject(new Error('Record not found'));
          return;
        }

        const updatedRecord = {
          ...record,
          ...data,
          id,
          updated_at: new Date().toISOString()
        };

        const updateRequest = store.put(updatedRecord);
        updateRequest.onsuccess = () => resolve(updatedRecord);
        updateRequest.onerror = () => reject(updateRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  },

  async delete(storeName, id) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },

  async getById(storeName, id) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  async getAll(storeName) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async query(storeName, filters = {}) {
    const allRecords = await this.getAll(storeName);

    if (Object.keys(filters).length === 0) {
      return allRecords;
    }

    return allRecords.filter(record => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === null || value === undefined) return true;
        return record[key] === value;
      });
    });
  },

  async getByIndex(storeName, indexName, value) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async count(storeName) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async clear(storeName) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
};

export const recalculateCustomerBalance = async (customerId) => {
  const customer = await dbOperations.getById('customers', customerId);
  if (!customer) return;

  const entries = await dbOperations.getByIndex('customer_ledger_entries', 'customer_id', customerId);
  const balance = entries.reduce((sum, entry) => sum + (entry.debit || 0) - (entry.credit || 0), 0);

  await dbOperations.update('customers', customerId, {
    current_balance: customer.opening_balance + balance
  });
};

export const recalculateVendorBalance = async (vendorId) => {
  const vendor = await dbOperations.getById('vendors', vendorId);
  if (!vendor) return;

  const entries = await dbOperations.getByIndex('vendor_ledger_entries', 'vendor_id', vendorId);
  const balance = entries.reduce((sum, entry) => sum + (entry.debit || 0) - (entry.credit || 0), 0);

  await dbOperations.update('vendors', vendorId, {
    current_balance: vendor.opening_balance + balance
  });
};

export const recalculateLabourBalance = async (labourId) => {
  const labour = await dbOperations.getById('labour', labourId);
  if (!labour) return;

  const entries = await dbOperations.getByIndex('labour_ledger_entries', 'labour_id', labourId);
  const balance = entries.reduce((sum, entry) => sum + (entry.debit || 0) - (entry.credit || 0), 0);

  await dbOperations.update('labour', labourId, {
    current_balance: labour.opening_balance + balance
  });
};

export const recalculateSupplierBalance = async (supplierId) => {
  const supplier = await dbOperations.getById('suppliers', supplierId);
  if (!supplier) return;

  const entries = await dbOperations.getByIndex('supplier_ledger_entries', 'supplier_id', supplierId);
  const balance = entries.reduce((sum, entry) => sum + (entry.debit || 0) - (entry.credit || 0), 0);

  await dbOperations.update('suppliers', supplierId, {
    current_balance: supplier.opening_balance + balance
  });
};

export const updateInventoryStock = async (itemId, movementType, quantity) => {
  const item = await dbOperations.getById('inventory_items', itemId);
  if (!item) return;

  let newStock = item.current_stock;

  if (movementType === 'in') {
    newStock += quantity;
  } else if (movementType === 'out') {
    newStock -= quantity;
  } else if (movementType === 'adjustment') {
    newStock = quantity;
  }

  await dbOperations.update('inventory_items', itemId, {
    current_stock: newStock
  });
};

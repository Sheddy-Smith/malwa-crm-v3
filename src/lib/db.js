const DB_NAME = 'malwa_erp_db';
const DB_VERSION = 8; // v8: Added purchase_challan_items store

let db = null;

// Enable detailed logging for debugging data flow
const DEBUG_MODE = true;

const log = (operation, storeName, data) => {
  if (DEBUG_MODE) {
    console.log(`[DB:${operation}] ${storeName}`, data);
  }
};

const STORES = {
  customers: 'id',
  customer_ledger_entries: 'id',
  customer_jobs: 'id',
  invoices: 'id',
  receipts: 'id',
  supplier_products: 'id',
  vendor_services: 'id',
  service_orders: 'id',
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
  purchase_challan_items: 'id',
  sell_challans: 'id',
  branches: 'id',
  profiles: 'id',
  users: 'id',
  // Job Module Stores
  jobs: 'id',
  inspections: 'id',
  estimates: 'id',
  estimate_items: 'id',
  jobsheets: 'id',
  jobsheet_items: 'id',
  challans: 'id',
  challan_items: 'id',
  stock_transactions: 'id',
  invoice_items: 'id',
  journal_entries: 'id',
  journal_lines: 'id',
  products: 'id',
  payments: 'id',
  offline_operations: 'id',
  meta: 'id',
  conflicts: 'id',
  // Account Module Stores
  accounts: 'id',
  purchases: 'id',
  purchase_items: 'id',
  gst_accounts: 'id',
  ledger_views: 'id',
  // Customer Module Stores
  documents: 'id',
  // Vendor, Labour, Supplier Module Stores
  vendor_orders: 'id',
  vendor_invoices: 'id',
  vendor_invoice_items: 'id',
  // Settings Module Stores
  templates: 'id',
  roles: 'id',
  permissions: 'id',
  taxes: 'id',
  hsn_codes: 'id',
  audit_logs: 'id',
  sequences: 'key' // Key-value store for auto-numbering
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
      const upgradeTxn = event.target.transaction;

      Object.entries(STORES).forEach(([storeName, keyPath]) => {
        if (!database.objectStoreNames.contains(storeName)) {
          const objectStore = database.createObjectStore(storeName, {
            keyPath,
            autoIncrement: false
          });

          if (storeName === 'customers') {
            objectStore.createIndex('phone', 'phone', { unique: false });
            objectStore.createIndex('email', 'email', { unique: false });
            objectStore.createIndex('name', 'name', { unique: false });
            objectStore.createIndex('type', 'type', { unique: false });
            objectStore.createIndex('company', 'company', { unique: false });
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
            objectStore.createIndex('name', 'name', { unique: false });
            objectStore.createIndex('serviceType', 'serviceType', { unique: false });
          } else if (storeName === 'labour') {
            objectStore.createIndex('code', 'code', { unique: true });
            objectStore.createIndex('technicianId', 'technicianId', { unique: false });
            objectStore.createIndex('employeeId', 'employeeId', { unique: false });
            objectStore.createIndex('vendorId', 'vendorId', { unique: false });
          } else if (storeName === 'suppliers') {
            objectStore.createIndex('code', 'code', { unique: true });
            objectStore.createIndex('name', 'name', { unique: false });
            objectStore.createIndex('gstin', 'gstin', { unique: false });
          } else if (storeName === 'inventory_items') {
            objectStore.createIndex('code', 'code', { unique: true });
            objectStore.createIndex('category_id', 'category_id', { unique: false });
          } else if (storeName === 'users') {
            objectStore.createIndex('email', 'email', { unique: true });
          }
          // Job Module Indexes
          else if (storeName === 'jobs') {
            objectStore.createIndex('status', 'status', { unique: false });
            objectStore.createIndex('customerId', 'customerId', { unique: false });
            objectStore.createIndex('scheduledStart', 'scheduledStart', { unique: false });
            objectStore.createIndex('createdAt', 'createdAt', { unique: false });
          } else if (storeName === 'inspections') {
            objectStore.createIndex('jobId', 'jobId', { unique: false });
            objectStore.createIndex('createdAt', 'createdAt', { unique: false });
          } else if (storeName === 'estimates') {
            objectStore.createIndex('customerId', 'customerId', { unique: false });
            objectStore.createIndex('jobId', 'jobId', { unique: false });
            objectStore.createIndex('date', 'date', { unique: false });
          } else if (storeName === 'estimate_items') {
            objectStore.createIndex('estimateId', 'estimateId', { unique: false });
            objectStore.createIndex('productId', 'productId', { unique: false });
          } else if (storeName === 'jobsheets') {
            objectStore.createIndex('jobId', 'jobId', { unique: false });
            objectStore.createIndex('technicianId', 'technicianId', { unique: false });
            objectStore.createIndex('date', 'date', { unique: false });
          } else if (storeName === 'jobsheet_items') {
            objectStore.createIndex('jobsheetId', 'jobsheetId', { unique: false });
            objectStore.createIndex('productId', 'productId', { unique: false });
            objectStore.createIndex('isIssued', 'isIssued', { unique: false });
          } else if (storeName === 'challans') {
            objectStore.createIndex('jobId', 'jobId', { unique: false });
            objectStore.createIndex('customerId', 'customerId', { unique: false });
            objectStore.createIndex('date', 'date', { unique: false });
          } else if (storeName === 'challan_items') {
            objectStore.createIndex('challanId', 'challanId', { unique: false });
            objectStore.createIndex('productId', 'productId', { unique: false });
          } else if (storeName === 'stock_transactions') {
            objectStore.createIndex('productId', 'productId', { unique: false });
            objectStore.createIndex('referenceType', 'referenceType', { unique: false });
            objectStore.createIndex('referenceId', 'referenceId', { unique: false });
            objectStore.createIndex('createdAt', 'createdAt', { unique: false });
          } else if (storeName === 'invoice_items') {
            objectStore.createIndex('invoiceId', 'invoiceId', { unique: false });
            objectStore.createIndex('productId', 'productId', { unique: false });
          } else if (storeName === 'journal_entries') {
            objectStore.createIndex('sourceType', 'sourceType', { unique: false });
            objectStore.createIndex('sourceId', 'sourceId', { unique: false });
            objectStore.createIndex('date', 'date', { unique: false });
          } else if (storeName === 'journal_lines') {
            objectStore.createIndex('journalEntryId', 'journalEntryId', { unique: false });
            objectStore.createIndex('accountId', 'accountId', { unique: false });
          } else if (storeName === 'offline_operations') {
            objectStore.createIndex('status', 'status', { unique: false });
            objectStore.createIndex('createdAt', 'createdAt', { unique: false });
            objectStore.createIndex('priority', 'priority', { unique: false });
          }
          // Account Module Indexes
          else if (storeName === 'accounts') {
            objectStore.createIndex('code', 'code', { unique: true });
            objectStore.createIndex('type', 'type', { unique: false });
            objectStore.createIndex('parentId', 'parentId', { unique: false });
          } else if (storeName === 'purchases') {
            objectStore.createIndex('supplierId', 'supplierId', { unique: false });
            objectStore.createIndex('vendorId', 'vendorId', { unique: false });
            objectStore.createIndex('date', 'date', { unique: false });
            objectStore.createIndex('status', 'status', { unique: false });
          } else if (storeName === 'purchase_items') {
            objectStore.createIndex('purchaseId', 'purchaseId', { unique: false });
            objectStore.createIndex('productId', 'productId', { unique: false });
          } else if (storeName === 'purchase_challans') {
            objectStore.createIndex('purchaseId', 'purchaseId', { unique: false });
            objectStore.createIndex('supplierId', 'supplierId', { unique: false });
            objectStore.createIndex('date', 'date', { unique: false });
          } else if (storeName === 'purchase_challan_items') {
            objectStore.createIndex('challan_id', 'challan_id', { unique: false });
            objectStore.createIndex('category_id', 'category_id', { unique: false });
          } else if (storeName === 'payments') {
            objectStore.createIndex('invoiceId', 'invoiceId', { unique: false });
            objectStore.createIndex('payeeId', 'payeeId', { unique: false });
            objectStore.createIndex('payeeType', 'payeeType', { unique: false });
            objectStore.createIndex('vendorId', 'vendorId', { unique: false });
            objectStore.createIndex('customerId', 'customerId', { unique: false });
            objectStore.createIndex('date', 'date', { unique: false });
          }
          // Customer Module Indexes
          else if (storeName === 'documents') {
            objectStore.createIndex('customerId', 'customerId', { unique: false });
            objectStore.createIndex('entityType', 'entityType', { unique: false });
            objectStore.createIndex('entityId', 'entityId', { unique: false });
            objectStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
            objectStore.createIndex('fileType', 'fileType', { unique: false });
          }
          // Vendor, Labour, Supplier Module Indexes
          else if (storeName === 'vendor_orders') {
            objectStore.createIndex('vendorId', 'vendorId', { unique: false });
            objectStore.createIndex('jobId', 'jobId', { unique: false });
            objectStore.createIndex('date', 'date', { unique: false });
            objectStore.createIndex('status', 'status', { unique: false });
          } else if (storeName === 'vendor_invoices') {
            objectStore.createIndex('vendorId', 'vendorId', { unique: false });
            objectStore.createIndex('jobId', 'jobId', { unique: false });
            objectStore.createIndex('serviceOrderId', 'serviceOrderId', { unique: false });
            objectStore.createIndex('date', 'date', { unique: false });
            objectStore.createIndex('status', 'status', { unique: false });
          } else if (storeName === 'vendor_invoice_items') {
            objectStore.createIndex('vendorInvoiceId', 'vendorInvoiceId', { unique: false });
          }
          // Settings Module Indexes
          else if (storeName === 'templates') {
            objectStore.createIndex('name', 'name', { unique: false });
            objectStore.createIndex('type', 'type', { unique: false });
            objectStore.createIndex('createdAt', 'createdAt', { unique: false });
          } else if (storeName === 'roles') {
            objectStore.createIndex('name', 'name', { unique: true });
            objectStore.createIndex('createdAt', 'createdAt', { unique: false });
          } else if (storeName === 'permissions') {
            objectStore.createIndex('roleId', 'roleId', { unique: false });
            objectStore.createIndex('resource', 'resource', { unique: false });
          } else if (storeName === 'taxes') {
            objectStore.createIndex('code', 'code', { unique: true });
            objectStore.createIndex('type', 'type', { unique: false });
            objectStore.createIndex('rate', 'rate', { unique: false });
          } else if (storeName === 'hsn_codes') {
            objectStore.createIndex('hsn', 'hsn', { unique: true });
            objectStore.createIndex('description', 'description', { unique: false });
          } else if (storeName === 'audit_logs') {
            objectStore.createIndex('userId', 'userId', { unique: false });
            objectStore.createIndex('actionType', 'actionType', { unique: false });
            objectStore.createIndex('createdAt', 'createdAt', { unique: false });
            objectStore.createIndex('entityType', 'entityType', { unique: false });
            objectStore.createIndex('entityId', 'entityId', { unique: false });
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

// Auto-numbering sequences
export const nextSequence = async (prefix) => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(['sequences'], 'readwrite');
    const store = tx.objectStore('sequences');
    const key = prefix;

    const getReq = store.get(key);
    getReq.onsuccess = () => {
      const current = getReq.result ? getReq.result.value : 0;
      const next = current + 1;
      const putReq = store.put({ key, value: next, updated_at: new Date().toISOString() });
      putReq.onsuccess = () => resolve(next);
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
};

export const generateCode = async (prefix, width = 3) => {
  const n = await nextSequence(prefix);
  return `${prefix}-${String(n).padStart(width, '0')}`;
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

      request.onsuccess = () => {
        log('INSERT', storeName, { id: record.id });
        resolve(record);
      };
      request.onerror = () => {
        log('INSERT_ERROR', storeName, request.error);
        reject(request.error);
      };
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
          log('UPDATE_ERROR', storeName, `Record not found: ${id}`);
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
        updateRequest.onsuccess = () => {
          log('UPDATE', storeName, { id });
          resolve(updatedRecord);
        };
        updateRequest.onerror = () => {
          log('UPDATE_ERROR', storeName, updateRequest.error);
          reject(updateRequest.error);
        };
      };

      getRequest.onerror = () => {
        log('UPDATE_ERROR', storeName, getRequest.error);
        reject(getRequest.error);
      };
    });
  },

  async delete(storeName, id) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        log('DELETE', storeName, { id });
        resolve(true);
      };
      request.onerror = () => {
        log('DELETE_ERROR', storeName, request.error);
        reject(request.error);
      };
    });
  },

  async getById(storeName, id) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result || null;
        log('GET_BY_ID', storeName, { id, found: !!result });
        resolve(result);
      };
      request.onerror = () => {
        log('GET_BY_ID_ERROR', storeName, request.error);
        reject(request.error);
      };
    });
  },

  async getAll(storeName) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result || [];
        log('GET_ALL', storeName, { count: result.length });
        resolve(result);
      };
      request.onerror = () => {
        log('GET_ALL_ERROR', storeName, request.error);
        reject(request.error);
      };
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

      request.onsuccess = () => {
        const result = request.result || [];
        log('GET_BY_INDEX', storeName, { indexName, value, count: result.length });
        resolve(result);
      };
      request.onerror = () => {
        log('GET_BY_INDEX_ERROR', storeName, request.error);
        reject(request.error);
      };
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

// Job Module Helper Methods
export const dbTransaction = async (storeNames, mode, callback) => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeNames, mode);
    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();
    
    try {
      callback(transaction);
    } catch (error) {
      reject(error);
    }
  });
};

export const bulkPut = async (storeName, records) => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const results = [];

    records.forEach(record => {
      const request = store.put({
        ...record,
        updated_at: record.updated_at || new Date().toISOString()
      });
      request.onsuccess = () => results.push(record);
    });

    transaction.oncomplete = () => resolve(results);
    transaction.onerror = () => reject(transaction.error);
  });
};

export const bulkGet = async (storeName, ids) => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const results = [];

    ids.forEach(id => {
      const request = store.get(id);
      request.onsuccess = () => {
        if (request.result) results.push(request.result);
      };
    });

    transaction.oncomplete = () => resolve(results);
    transaction.onerror = () => reject(transaction.error);
  });
};

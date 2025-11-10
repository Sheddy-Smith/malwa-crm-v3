# Malwa CRM - Local Database Guide (IndexedDB Only)

## 🎯 Overview

Malwa CRM now operates as a **fully local application** using IndexedDB as the sole database. No backend, no cloud, no internet required - all data is stored locally on your device!

---

## ✨ Key Features

### 1. **100% Local Storage**
- All data stored in browser's IndexedDB
- No external database required
- No internet connection needed
- Complete data privacy

### 2. **Instant Performance**
- No network latency
- Immediate data access
- Fast CRUD operations
- Responsive UI

### 3. **Data Persistence**
- Data survives browser restart
- Persistent storage API
- Large storage capacity (1GB+)
- Automatic backups recommended

### 4. **Complete Privacy**
- Data never leaves your device
- No cloud storage
- No third-party access
- Full control over your data

---

## 🏗️ Architecture

### **Single-Tier Architecture:**

```
┌─────────────────────────────────────┐
│      Malwa CRM Application          │
│  (React + Zustand State Management) │
└───────────────┬─────────────────────┘
                │
                v
┌────────────────────────────────────────┐
│         Local Database Layer           │
│      (localDatabase.js wrapper)        │
└───────────────┬────────────────────────┘
                │
                v
┌────────────────────────────────────────┐
│        IndexedDB (Browser API)         │
│      Storage: ~/browser/IndexedDB      │
└────────────────────────────────────────┘
```

### **Data Flow:**

```
User Action
    ↓
Store Method Called
    ↓
localDB API
    ↓
IndexedDB Operation
    ↓
Data Persisted to Disk
    ↓
UI Updated
```

---

## 📦 IndexedDB Structure

### **Database Name:** `MalwaCRM_DB`
### **Version:** 1
### **Location:** Browser's IndexedDB storage

### **Object Stores (Tables):**

| Store Name | Purpose | Key Field |
|------------|---------|-----------|
| **profiles** | User profiles | id |
| **customers** | Customer data | id |
| **vendors** | Vendor information | id |
| **suppliers** | Supplier records | id |
| **labours** | Labour/worker data | id |
| **inventory** | Stock/inventory items | id |
| **jobs** | Job/work orders | id |
| **ledgerEntries** | Financial ledger | id |
| **settings** | App settings | id |
| **companies** | Company master data | id |

### **Indexes on All Stores:**
- `user_id` - Filter by user (multi-user support)
- `updated_at` - Sort by last update
- `created_at` - Sort by creation date

---

## 🔐 Authentication

### **Local Authentication:**

**Credentials:**
```
Email: Shahidmultaniii@gmail.com
Password: S#d_8224
```

### **How It Works:**

1. User enters credentials
2. Email/password validated locally
3. User ID generated (UUID v4)
4. User ID stored in localStorage
5. Profile created in IndexedDB
6. Session maintained in Zustand

**No backend authentication** - credentials are hardcoded in the app for simplicity.

---

## 💾 Local Database API

### **Import:**
```javascript
import { localDB, STORES } from '@/utils/localDatabase';
```

### **Operations:**

#### **Create Record:**
```javascript
const customer = await localDB.createRecord(STORES.customers, {
  name: 'ABC Corp',
  phone: '1234567890',
  email: 'abc@example.com',
  user_id: userId
});
```

#### **Read Record:**
```javascript
// Get by ID
const customer = await localDB.getRecord(STORES.customers, customerId);

// Get all records
const customers = await localDB.getAllRecords(STORES.customers, userId);

// Query with filter
const activeCustomers = await localDB.queryRecords(
  STORES.customers,
  (c) => c.status === 'active'
);
```

#### **Update Record:**
```javascript
const updated = await localDB.updateRecord(
  STORES.customers,
  customerId,
  { phone: '9876543210', email: 'newemail@example.com' }
);
```

#### **Delete Record:**
```javascript
await localDB.deleteRecord(STORES.customers, customerId);
```

#### **Bulk Operations:**
```javascript
const result = await localDB.bulkCreate(STORES.customers, [
  { name: 'Customer 1', phone: '111' },
  { name: 'Customer 2', phone: '222' },
  { name: 'Customer 3', phone: '333' }
]);
```

#### **Count Records:**
```javascript
const count = await localDB.countRecords(STORES.customers);
```

#### **Clear Store:**
```javascript
await localDB.clearStore(STORES.customers);
```

---

## 🔄 Store Pattern (Zustand)

### **Example: Customer Store**

```javascript
import { create } from 'zustand';
import { localDB, STORES } from '@/utils/localDatabase';
import useAuthStore from './authStore';

const useCustomerStore = create((set, get) => ({
  customers: [],
  loading: false,
  error: null,

  // Load all customers
  loadCustomers: async () => {
    set({ loading: true, error: null });
    try {
      const userId = useAuthStore.getState().user?.id;
      const customers = await localDB.getAllRecords(STORES.customers, userId);
      set({ customers, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Add new customer
  addCustomer: async (customerData) => {
    const userId = useAuthStore.getState().user?.id;
    const customer = await localDB.createRecord(STORES.customers, {
      ...customerData,
      user_id: userId
    });
    set((state) => ({ customers: [...state.customers, customer] }));
    return customer;
  },

  // Update customer
  updateCustomer: async (id, updates) => {
    const updated = await localDB.updateRecord(STORES.customers, id, updates);
    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? updated : c))
    }));
    return updated;
  },

  // Delete customer
  deleteCustomer: async (id) => {
    await localDB.deleteRecord(STORES.customers, id);
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id)
    }));
  },
}));
```

---

## 🎨 UI Integration

### **Load Data on Component Mount:**

```javascript
import { useEffect } from 'react';
import useCustomerStore from '@/store/customerStore';

function CustomerList() {
  const { customers, loadCustomers } = useCustomerStore();

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return (
    <div>
      {customers.map((customer) => (
        <div key={customer.id}>{customer.name}</div>
      ))}
    </div>
  );
}
```

### **Create New Record:**

```javascript
async function handleCreate() {
  try {
    await addCustomer({
      name: 'New Customer',
      phone: '1234567890'
    });
    toast.success('Customer added!');
  } catch (error) {
    toast.error('Failed to add customer');
  }
}
```

---

## 📊 Storage Management

### **Check Storage Usage:**

```javascript
if (navigator.storage && navigator.storage.estimate) {
  const estimate = await navigator.storage.estimate();
  console.log('Used:', estimate.usage, 'bytes');
  console.log('Quota:', estimate.quota, 'bytes');
  console.log('Percentage:', (estimate.usage / estimate.quota * 100).toFixed(2) + '%');
}
```

### **Storage Limits by Browser:**

| Browser | Default Limit | Notes |
|---------|---------------|-------|
| Chrome | ~80% of free disk | Dynamic |
| Firefox | 2GB (can request more) | Configurable |
| Safari | 1GB | Fixed |
| Edge | ~80% of free disk | Like Chrome |

### **Request Persistent Storage:**

```javascript
if (navigator.storage && navigator.storage.persist) {
  const isPersisted = await navigator.storage.persist();
  console.log('Storage persisted:', isPersisted);
}
```

---

## 💾 Backup & Restore

### **Export All Data:**

```javascript
async function exportAllData() {
  const data = {};

  for (const storeName of Object.values(STORES)) {
    data[storeName] = await localDB.getAllRecords(storeName);
  }

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `malwa-crm-backup-${new Date().toISOString()}.json`;
  a.click();

  URL.revokeObjectURL(url);
}
```

### **Import Data:**

```javascript
async function importData(file) {
  const text = await file.text();
  const data = JSON.parse(text);

  for (const [storeName, records] of Object.entries(data)) {
    if (records && records.length > 0) {
      await localDB.bulkCreate(storeName, records);
    }
  }

  toast.success('Data imported successfully!');
}
```

---

## 🔧 Configuration

### **User ID Management:**

User ID is stored in localStorage:
```javascript
const userId = localStorage.getItem('malwa_user_id');
```

### **Multi-User Support:**

Each user gets their own data partition:
```javascript
// All records have user_id field
const myCustomers = await localDB.getAllRecords(STORES.customers, userId);
```

---

## 🐛 Troubleshooting

### **Problem: Data not appearing**

**Solution:**
1. Check if `loadCustomers()` is called
2. Verify user is logged in
3. Check browser console for errors
4. Inspect IndexedDB in DevTools

### **Problem: "Quota Exceeded" error**

**Solution:**
1. Check storage usage
2. Clear old data
3. Export and reimport essential data
4. Use DevTools → Application → Clear Storage

### **Problem: Data lost after browser update**

**Solution:**
1. Regular backups essential!
2. Use persistent storage API
3. Export data before updates
4. Keep backup JSON files

### **Problem: Slow performance**

**Solution:**
1. Don't load all records at once
2. Use pagination
3. Implement lazy loading
4. Add indexes on frequently queried fields

---

## 📱 DevTools Inspection

### **View IndexedDB:**

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **IndexedDB**
4. Expand **MalwaCRM_DB**
5. Click any store to view data

### **Manually Edit Data:**

1. Right-click on record
2. Select "Delete" or "Add"
3. Double-click value to edit
4. Changes save automatically

### **Clear All Data:**

```javascript
// In console:
indexedDB.deleteDatabase('MalwaCRM_DB');
location.reload();
```

---

## 🔒 Security Considerations

### **Data Security:**

1. **Local Only:**
   - Data never transmitted
   - No network exposure
   - Physical device security critical

2. **Authentication:**
   - Hardcoded credentials (for simplicity)
   - Consider encryption for production
   - User ID in localStorage

3. **Browser Security:**
   - IndexedDB is per-origin
   - Same-origin policy applies
   - HTTPS recommended in production

### **Best Practices:**

1. **Regular Backups:**
   - Export data weekly
   - Keep multiple backup copies
   - Store in secure location

2. **Access Control:**
   - Lock computer when away
   - Use browser profiles
   - Consider OS-level encryption

3. **Data Validation:**
   - Validate user input
   - Sanitize before storage
   - Check data integrity

---

## 🚀 Performance Tips

### **1. Lazy Loading:**
```javascript
// Load only what's needed
const recentCustomers = await localDB.queryRecords(
  STORES.customers,
  (c) => new Date(c.created_at) > thirtyDaysAgo
);
```

### **2. Pagination:**
```javascript
const page1 = customers.slice(0, 50);
const page2 = customers.slice(50, 100);
```

### **3. Debounced Search:**
```javascript
const debouncedSearch = debounce(async (term) => {
  const results = await localDB.queryRecords(
    STORES.customers,
    (c) => c.name.toLowerCase().includes(term.toLowerCase())
  );
  setSearchResults(results);
}, 300);
```

### **4. Batch Updates:**
```javascript
// Instead of multiple updates
for (const customer of customers) {
  await localDB.updateRecord(STORES.customers, customer.id, updates);
}

// Use bulk operation
const updated = customers.map(c => ({ ...c, ...updates }));
await localDB.bulkCreate(STORES.customers, updated);
```

---

## 📚 Migration Guide

### **From Cloud to Local:**

If you were using Supabase before:

1. **Export data from Supabase**
2. **Convert to local format:**
   ```javascript
   const localData = supabaseData.map(record => ({
     ...record,
     user_id: userId
   }));
   ```
3. **Import to IndexedDB:**
   ```javascript
   await localDB.bulkCreate(STORES.customers, localData);
   ```

---

## 🎓 Best Practices

### **1. Always Handle Errors:**
```javascript
try {
  await localDB.createRecord(STORES.customers, data);
  toast.success('Saved!');
} catch (error) {
  console.error(error);
  toast.error('Failed to save');
}
```

### **2. Show Loading States:**
```javascript
const [loading, setLoading] = useState(false);

async function loadData() {
  setLoading(true);
  try {
    await loadCustomers();
  } finally {
    setLoading(false);
  }
}
```

### **3. Validate Before Save:**
```javascript
if (!data.name || !data.phone) {
  toast.error('Name and phone required');
  return;
}
await addCustomer(data);
```

### **4. Use Transactions (Advanced):**
```javascript
// For multiple related operations
const tx = db.transaction(['customers', 'ledger'], 'readwrite');
await tx.objectStore('customers').add(customer);
await tx.objectStore('ledger').add(entry);
await tx.done;
```

---

## ✅ Feature Checklist

**Implemented:**
- [x] Local IndexedDB storage
- [x] 10 data stores (tables)
- [x] CRUD operations
- [x] Multi-user support
- [x] Data persistence
- [x] Fast performance
- [x] Large storage capacity
- [x] Auto-generated IDs
- [x] Timestamps
- [x] Indexes for queries

**Not Included:**
- [ ] Cloud backup
- [ ] Multi-device sync
- [ ] Real-time collaboration
- [ ] Online backup
- [ ] Cloud storage

---

## 🎯 Use Cases

**Perfect For:**
- ✅ Single-user desktop app
- ✅ Offline-first applications
- ✅ Privacy-focused solutions
- ✅ Local data management
- ✅ No internet environments

**Not Ideal For:**
- ❌ Multi-device sync needed
- ❌ Team collaboration required
- ❌ Cloud backup essential
- ❌ Mobile-first approach
- ❌ Large shared datasets

---

## 📞 Support

**For Issues:**
- Email: malwatrolley@gmail.com
- Phone: +91 8224000822

**For Technical Problems:**
- Check browser console
- Inspect IndexedDB in DevTools
- Clear browser cache
- Try different browser

---

## 🎉 Summary

Malwa CRM is now a **fully local application** with:

✅ **Complete Privacy** - Data never leaves your device
✅ **No Internet Required** - Works 100% offline
✅ **Fast Performance** - No network latency
✅ **Simple Architecture** - No backend complexity
✅ **Large Capacity** - 1GB+ storage
✅ **Easy Backup** - Export/import JSON
✅ **Cross-Browser** - Works on all modern browsers
✅ **Persistent** - Data survives restarts

**Your data, your device, your control!** 🔒

---

## 🔑 Quick Reference

### **Login:**
```
Email: Shahidmultaniii@gmail.com
Password: S#d_8224
```

### **Storage Location:**
```
Browser IndexedDB
Database: MalwaCRM_DB
```

### **Backup:**
```javascript
// Export regularly!
exportAllData();
```

### **View Data:**
```
DevTools → Application → IndexedDB → MalwaCRM_DB
```

---

© 2025 Malwa Trolley CRM • Local-First Architecture

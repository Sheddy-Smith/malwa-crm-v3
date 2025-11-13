# Malwa CRM - Offline Support & IndexedDB Guide

## 🎯 Overview

Malwa CRM now includes full offline support using IndexedDB for local storage and automatic synchronization with Supabase when online. Work seamlessly even without internet connection!

---

## ✨ Key Features

### 1. **Automatic Offline Detection**
- Real-time online/offline status monitoring
- Visual indicators in UI (Navbar & floating notification)
- Seamless switching between modes

### 2. **Local Data Storage (IndexedDB)**
- All data cached locally in browser
- Fast access even when offline
- Persistent storage (survives browser restart)
- Large storage capacity (up to 1GB+)

### 3. **Automatic Sync**
- Changes sync automatically when online
- Sync queue for offline actions
- Smart conflict resolution
- Auto-sync every 30 seconds

### 4. **Offline Capabilities**
- ✅ View all data offline
- ✅ Create new records offline
- ✅ Edit existing records offline
- ✅ Delete records offline
- ✅ Search and filter offline
- ✅ Generate reports offline

---

## 🏗️ Architecture

### **Dual Storage System:**

```
┌─────────────────────────────────────────┐
│         Malwa CRM Application           │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    v                   v
┌─────────┐      ┌──────────────┐
│ Supabase│      │  IndexedDB   │
│ (Cloud) │◄────►│   (Local)    │
└─────────┘      └──────────────┘
  Online           Always Works
 Primary DB        Offline Cache
```

### **Data Flow:**

```
User Action
    ↓
Check Online Status
    ↓
    ├─ Online: Save to Supabase + IndexedDB
    │           (Immediate sync)
    │
    └─ Offline: Save to IndexedDB only
                Add to Sync Queue
                (Sync when online)
```

---

## 📦 IndexedDB Structure

### **Database Name:** `MalwaCRM_DB`
### **Version:** 1

### **Object Stores (Tables):**

1. **customers**
   - Stores customer data
   - Indexed by: user_id, updated_at, created_at

2. **vendors**
   - Vendor information
   - Same indexes as above

3. **suppliers**
   - Supplier records
   - Same indexes

4. **labours**
   - Labour/worker data
   - Same indexes

5. **inventory**
   - Stock/inventory items
   - Same indexes

6. **jobs**
   - Job/work orders
   - Same indexes

7. **ledgerEntries**
   - Financial ledger entries
   - Same indexes

8. **settings**
   - App settings
   - Same indexes

9. **companies**
   - Company master data
   - Same indexes

10. **syncQueue**
    - Pending sync operations
    - Indexed by: status, timestamp
    - Special store for offline actions

---

## 🔄 How Sync Works

### **Sync Queue Structure:**

```javascript
{
  id: 'uuid-v4',
  action: 'create' | 'update' | 'delete',
  storeName: 'customers',
  data: { ...record data... },
  timestamp: '2025-01-06T12:00:00Z',
  status: 'pending' | 'syncing' | 'failed',
  retries: 0
}
```

### **Sync Process:**

1. **User performs action offline**
   - Data saved to IndexedDB
   - Action added to sync queue

2. **Internet connection restored**
   - Offline indicator shows "Back Online"
   - Auto-sync triggered

3. **Sync queue processing**
   - Each queued item synced to Supabase
   - On success: Removed from queue
   - On failure: Retry up to 3 times
   - After 3 failures: Marked as 'failed'

4. **Manual sync available**
   - Click "Sync Now" on notification
   - Forces immediate sync

---

## 🎨 UI Indicators

### **1. Navbar Status Badge**

**Location:** Top-right corner of navbar

**Online:**
```
🟢 [Cloud Icon] Online
```

**Offline:**
```
🟠 [Hard Drive Icon] Offline
```

### **2. Floating Notification**

**Appears:** Bottom-right corner

**When Offline:**
```
┌──────────────────────────────────┐
│ 🔴 You're Offline                │
│ Changes will sync when online    │
└──────────────────────────────────┘
```

**When Back Online:**
```
┌──────────────────────────────────┐
│ 🟢 Back Online                   │
│ [Sync Now] button                │
└──────────────────────────────────┘
```

---

## 💻 Usage Guide

### **Normal Operation (Online):**

1. **All actions work as usual**
   - Create, read, update, delete
   - Changes save to cloud immediately
   - Also cached locally for fast access

2. **Automatic background sync**
   - Every 30 seconds
   - Ensures local and cloud in sync

### **Offline Operation:**

1. **Connection lost**
   - App detects offline status
   - Orange "Offline" badge appears
   - Floating notification shows

2. **Continue working normally**
   - All CRUD operations work
   - Data saved to IndexedDB
   - Actions queued for sync

3. **What you CAN do offline:**
   - View all previously loaded data
   - Create new customers/vendors/etc.
   - Edit existing records
   - Delete records
   - Search and filter
   - View dashboards
   - Generate reports (PDF/Excel)

4. **What you CANNOT do offline:**
   - Initial data load (if cache empty)
   - Real-time collaboration
   - Receive updates from other users
   - Upload/download files

### **Coming Back Online:**

1. **Connection restored**
   - Green "Back Online" notification
   - "Sync Now" button available

2. **Automatic sync starts**
   - All queued actions processed
   - Cloud database updated
   - Local cache refreshed

3. **Sync confirmation**
   - Success toast notification
   - All data now in sync

---

## 🛠️ Developer Guide

### **Using Offline Data Manager:**

```javascript
import { offlineDataManager } from '@/utils/offlineDataManager';
import { STORES } from '@/utils/indexedDB';

// Get user ID from auth
const userId = useAuthStore.getState().user?.id;

// Create data
const result = await offlineDataManager.createData(
  STORES.customers,
  { name: 'ABC Corp', phone: '1234567890' },
  userId
);

// Update data
await offlineDataManager.saveData(
  STORES.customers,
  { id: '123', name: 'ABC Corporation' },
  userId
);

// Delete data
await offlineDataManager.deleteData(
  STORES.customers,
  '123',
  userId
);

// Get all data (auto-syncs if online)
const customers = await offlineDataManager.getData(
  STORES.customers,
  userId
);

// Get by ID
const customer = await offlineDataManager.getById(
  STORES.customers,
  '123'
);
```

### **Using IndexedDB Directly:**

```javascript
import { indexedDB, STORES } from '@/utils/indexedDB';

// Initialize (done automatically in App.jsx)
await indexedDB.init();

// Get all records
const allCustomers = await indexedDB.getAll(STORES.customers);

// Get by ID
const customer = await indexedDB.getById(STORES.customers, '123');

// Add new record
await indexedDB.add(STORES.customers, {
  id: '123',
  name: 'ABC Corp',
  user_id: userId
});

// Update record
await indexedDB.put(STORES.customers, {
  id: '123',
  name: 'ABC Corporation',
  user_id: userId
});

// Delete record
await indexedDB.delete(STORES.customers, '123');

// Bulk update
await indexedDB.bulkPut(STORES.customers, [
  { id: '1', name: 'Customer 1' },
  { id: '2', name: 'Customer 2' }
]);

// Query by index
const userCustomers = await indexedDB.getByIndex(
  STORES.customers,
  'user_id',
  userId
);

// Count records
const count = await indexedDB.count(STORES.customers);

// Clear store
await indexedDB.clear(STORES.customers);
```

### **Using Sync Manager:**

```javascript
import { syncManager } from '@/utils/syncManager';

// Check online status
const isOnline = syncManager.isOnline;

// Subscribe to status changes
const unsubscribe = syncManager.subscribe((isOnline) => {
  console.log('Status changed:', isOnline ? 'Online' : 'Offline');
});

// Manual sync
await syncManager.syncAll();

// Sync from Supabase
await syncManager.syncFromSupabase(userId);

// Add to sync queue (done automatically)
await syncManager.addToSyncQueue(
  'create',
  STORES.customers,
  { id: '123', name: 'ABC Corp', user_id: userId }
);

// Process sync queue
await syncManager.processSyncQueue();

// Clear local data
await syncManager.clearLocalData();

// Auto-sync control
syncManager.startAutoSync(30000); // Every 30 seconds
syncManager.stopAutoSync();

// Cleanup
unsubscribe();
```

### **Using Offline Status Hook:**

```javascript
import { useOfflineStatus } from '@/hooks/useOfflineStatus';

function MyComponent() {
  const isOnline = useOfflineStatus();

  return (
    <div>
      {isOnline ? (
        <span>🟢 Online</span>
      ) : (
        <span>🔴 Offline</span>
      )}
    </div>
  );
}
```

---

## 🔧 Configuration

### **Auto-Sync Interval:**

Default: 30 seconds

To change:
```javascript
// In App.jsx
syncManager.startAutoSync(60000); // 60 seconds
```

### **Retry Settings:**

Default: 3 retries per failed sync

To change (in syncManager.js):
```javascript
item.status = item.retries > 5 ? 'failed' : 'pending'; // 5 retries
```

### **Storage Limits:**

IndexedDB has no strict limits but varies by browser:
- **Chrome:** ~80% of free disk space
- **Firefox:** 2GB default (can request more)
- **Safari:** 1GB default
- **Edge:** Similar to Chrome

---

## 🐛 Troubleshooting

### **Problem: Data not syncing**

**Solution:**
1. Check online status indicator
2. Open DevTools → Console
3. Look for sync errors
4. Try manual sync: Click "Sync Now"
5. If failed, check Supabase credentials

### **Problem: "Quota Exceeded" error**

**Solution:**
1. Clear old data from IndexedDB
2. Use DevTools → Application → IndexedDB
3. Delete old records manually
4. Or programmatically:
```javascript
await indexedDB.clearAll();
```

### **Problem: Offline indicator stuck**

**Solution:**
1. Refresh the page (F5)
2. Check actual internet connection
3. Open DevTools → Network tab
4. Verify requests are going through

### **Problem: Duplicate records after sync**

**Solution:**
1. Ensure records have unique IDs
2. Use `upsert` instead of `insert`
3. Clear sync queue:
```javascript
await indexedDB.clear(STORES.syncQueue);
```

### **Problem: Can't see data offline**

**Solution:**
1. Data must be loaded once while online
2. Initial sync required after login
3. Check if auto-sync completed:
```javascript
const count = await indexedDB.count(STORES.customers);
console.log('Cached customers:', count);
```

---

## 📊 Performance Tips

### **1. Optimize Initial Sync:**
```javascript
// Sync only essential data first
await syncManager.syncFromSupabase(userId);
```

### **2. Lazy Load Large Data:**
```javascript
// Load data on-demand, not all at once
const data = await offlineDataManager.getData(storeName, userId);
```

### **3. Use Indexes:**
```javascript
// Query by index for faster results
const records = await indexedDB.getByIndex(
  STORES.customers,
  'user_id',
  userId
);
```

### **4. Batch Operations:**
```javascript
// Bulk update instead of individual puts
await indexedDB.bulkPut(STORES.customers, customersArray);
```

### **5. Clear Old Data:**
```javascript
// Periodically clear old records
const cutoffDate = new Date();
cutoffDate.setMonth(cutoffDate.getMonth() - 6);
// Filter and delete old records
```

---

## 🔐 Security Considerations

### **1. Local Data Encryption:**
- IndexedDB data is NOT encrypted by default
- Do NOT store sensitive passwords in IndexedDB
- Use Supabase auth for authentication

### **2. User Data Isolation:**
- All records have `user_id` field
- RLS policies ensure data separation
- Local queries filter by `user_id`

### **3. Sync Queue Security:**
- Queued actions include `user_id`
- Server-side validation on sync
- RLS policies enforce permissions

---

## 📱 Browser Compatibility

| Browser | IndexedDB Support | Offline Support | Notes |
|---------|-------------------|-----------------|-------|
| Chrome 24+ | ✅ Full | ✅ Full | Best performance |
| Firefox 16+ | ✅ Full | ✅ Full | Excellent support |
| Safari 10+ | ✅ Full | ✅ Full | Good support |
| Edge 12+ | ✅ Full | ✅ Full | Chrome-based |
| Opera 15+ | ✅ Full | ✅ Full | Chrome-based |
| Mobile Browsers | ✅ Full | ✅ Full | iOS/Android |

---

## 🎓 Best Practices

### **1. Always Handle Offline State:**
```javascript
const isOnline = useOfflineStatus();

if (!isOnline) {
  toast.warning('You are offline. Changes will sync when online.');
}
```

### **2. Provide User Feedback:**
```javascript
// Show loading states
// Display sync status
// Indicate offline mode clearly
```

### **3. Handle Sync Errors:**
```javascript
try {
  await syncManager.syncAll();
} catch (error) {
  console.error('Sync error:', error);
  toast.error('Sync failed. Will retry automatically.');
}
```

### **4. Test Offline Scenarios:**
- Test creating records offline
- Test editing offline
- Test sync when back online
- Test network fluctuations

### **5. Monitor Storage Usage:**
```javascript
if (navigator.storage && navigator.storage.estimate) {
  const estimate = await navigator.storage.estimate();
  console.log('Storage used:', estimate.usage);
  console.log('Storage quota:', estimate.quota);
}
```

---

## 🚀 Advanced Features

### **Custom Sync Logic:**

Extend `SyncManager` class:
```javascript
class CustomSyncManager extends SyncManager {
  async syncItem(item) {
    // Custom sync logic
    // Add conflict resolution
    // Handle special cases
    return super.syncItem(item);
  }
}
```

### **Selective Sync:**

Sync only specific stores:
```javascript
async function syncCustomers() {
  const customers = await indexedDB.getAll(STORES.customers);
  for (const customer of customers) {
    await offlineDataManager.saveData(
      STORES.customers,
      customer,
      userId
    );
  }
}
```

### **Export/Import Data:**

```javascript
// Export all local data
async function exportLocalData() {
  const data = {};
  for (const store of Object.values(STORES)) {
    data[store] = await indexedDB.getAll(store);
  }
  return JSON.stringify(data);
}

// Import data
async function importLocalData(jsonData) {
  const data = JSON.parse(jsonData);
  for (const [store, records] of Object.entries(data)) {
    await indexedDB.bulkPut(store, records);
  }
}
```

---

## ✅ Testing Checklist

**Offline Mode:**
- [ ] Can view cached data offline
- [ ] Can create new records offline
- [ ] Can edit existing records offline
- [ ] Can delete records offline
- [ ] Search works offline
- [ ] Filters work offline
- [ ] Offline indicator appears

**Sync Process:**
- [ ] Changes sync when back online
- [ ] Sync notification appears
- [ ] Manual sync works
- [ ] Auto-sync runs every 30s
- [ ] Failed syncs retry
- [ ] Duplicate prevention works

**Edge Cases:**
- [ ] Handle simultaneous edits
- [ ] Handle deleted records
- [ ] Handle quota exceeded
- [ ] Handle browser restart
- [ ] Handle slow connections

---

## 📞 Support

For issues with offline features:
- **Email:** malwatrolley@gmail.com
- **Phone:** +91 8224000822

For technical bugs:
- Check browser console for errors
- Inspect IndexedDB in DevTools
- Review sync queue status

---

## 🎉 Summary

Malwa CRM now works **completely offline** with:
- ✅ IndexedDB for local storage
- ✅ Automatic sync with Supabase
- ✅ Visual offline indicators
- ✅ Sync queue for offline actions
- ✅ Smart conflict resolution
- ✅ Fast performance
- ✅ Large storage capacity
- ✅ Cross-browser support

**Work anywhere, sync everywhere!** 🚀

---

© 2025 Malwa Trolley CRM • Offline-First Architecture

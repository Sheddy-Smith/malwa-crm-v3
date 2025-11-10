# Malwa CRM - Offline Database System Guide

## 📋 Overview

The Malwa CRM now features a **comprehensive offline database structure** using IndexedDB with automatic backup/restore capabilities to the local file system.

---

## 🗂️ Folder Structure

```
C:/malwa_crm/
├── Data_Base/
│   ├── MalwaCRM_Customers_backup.json
│   ├── MalwaCRM_Sales_backup.json
│   ├── MalwaCRM_Inventory_backup.json
│   ├── MalwaCRM_Jobs_backup.json
│   ├── MalwaCRM_Employees_backup.json
│   ├── MalwaCRM_Vendors_backup.json
│   ├── MalwaCRM_Ledger_backup.json
│   ├── MalwaCRM_Reports_backup.json
│   ├── MalwaCRM_Settings_backup.json
│   └── MalwaCRM_System_backup.json
```

**Automatic Creation:**
- Folders are automatically created when the Electron app starts
- No manual setup required
- All backup files use `.json` format

---

## 📊 Database Structure

### 10 Separate IndexedDB Databases

Each CRM module has its own isolated database:

#### 1. **Customers Database** (`MalwaCRM_Customers`)
- **customers** - Customer master data
- **contacts** - Customer contact persons
- **addresses** - Customer addresses
- **vehicles** - Customer vehicle information

#### 2. **Sales Database** (`MalwaCRM_Sales`)
- **invoices** - Sales invoices
- **estimates** - Job estimates
- **chalans** - Delivery challans
- **payments** - Payment records

#### 3. **Inventory Database** (`MalwaCRM_Inventory`)
- **items** - Inventory items/parts
- **categories** - Item categories
- **stock_movements** - Stock in/out transactions
- **suppliers** - Supplier master data

#### 4. **Jobs Database** (`MalwaCRM_Jobs`)
- **jobs** - Job/work order master
- **inspections** - Vehicle inspection records
- **job_sheets** - Job sheet details
- **job_parts** - Parts used in jobs
- **job_labour** - Labour assigned to jobs

#### 5. **Employees Database** (`MalwaCRM_Employees`)
- **employees** - Employee master data
- **labour** - Labour/mechanic details
- **attendance** - Attendance records
- **payroll** - Payroll information

#### 6. **Vendors Database** (`MalwaCRM_Vendors`)
- **vendors** - Vendor master data
- **purchases** - Purchase orders
- **vendor_payments** - Vendor payment records

#### 7. **Ledger Database** (`MalwaCRM_Ledger`)
- **ledger_entries** - General ledger entries
- **cash_receipts** - Cash receipt records
- **vouchers** - Payment/receipt vouchers
- **gst_records** - GST transaction records

#### 8. **Reports Database** (`MalwaCRM_Reports`)
- **saved_reports** - Saved report instances
- **report_templates** - Report templates
- **export_history** - Export/download history

#### 9. **Settings Database** (`MalwaCRM_Settings`)
- **companies** - Company master data
- **users** - User accounts
- **app_settings** - Application settings
- **multipliers** - Price multipliers
- **branches** - Branch information

#### 10. **System Database** (`MalwaCRM_System`)
- **sync_queue** - Sync queue (for future use)
- **backup_history** - Backup operation logs
- **audit_logs** - System audit trail
- **sessions** - User session data

---

## 🔧 Key Features

### ✅ Automatic Initialization
- All databases are automatically created on first run
- Object stores (tables) created with proper indexes
- No manual database setup required

### ✅ Separate Databases
- Each module is isolated in its own database
- Better organization and performance
- Easy to backup/restore individual modules
- Prevents data conflicts

### ✅ Comprehensive Indexes
- Every table has optimized indexes
- Fast queries on common fields
- Efficient data retrieval

### ✅ Automatic Timestamps
- `created_at` - Record creation timestamp
- `updated_at` - Last update timestamp
- Automatically managed by the system

### ✅ Backup System
- **Individual Module Backup** - Backup single databases
- **Full System Backup** - Backup all databases at once
- **Automatic File Naming** - `{DatabaseName}_backup.json`
- **File System Integration** - Direct save to `C:/malwa_crm/Data_Base/`

### ✅ Restore System
- **Individual Module Restore** - Restore single databases
- **Full System Restore** - Restore all databases
- **Data Validation** - Ensures backup integrity
- **Overwrites Safely** - Confirms before overwriting

---

## 💻 Usage Guide

### Accessing the Backup System

1. Open **Settings** page
2. Click on **Backup & Restore** tab
3. All backup operations are available here

### Creating a Backup

**Full Backup:**
1. Click **"Backup All Databases"** button
2. Wait for completion (shows progress)
3. Check `C:/malwa_crm/Data_Base/` folder

**Single Module Backup:**
1. Find the module in the statistics section
2. Click **"Backup"** button next to the module
3. File saved to Data_Base folder

### Restoring from Backup

**Full Restore:**
1. Click **"Restore All Databases"**
2. Confirm the warning dialog
3. Wait for completion
4. Data is restored from backup files

**Single Module Restore:**
1. Find the module in the statistics section
2. Click **"Restore"** button
3. Confirm overwrite
4. Module data restored

### Opening Backup Folder

1. Click **"Open Backup Folder"** button
2. File explorer opens at `C:/malwa_crm/Data_Base/`
3. View, copy, or manage backup files

---

## 📱 Desktop App Features

### File System Access (Electron Only)

The backup system has full file system access in the desktop app:

- ✅ Direct file read/write to `C:/malwa_crm/Data_Base/`
- ✅ Automatic folder creation
- ✅ File listing and management
- ✅ Open backup folder in explorer
- ✅ Delete old backups

### Browser Fallback

When running in browser (not Electron):

- ⚠️ File system access limited
- 📥 Backups download to Downloads folder
- 📤 Restore via file picker
- ⚠️ No automatic folder creation

---

## 🔄 Auto-Backup Scheduler

The system includes an automatic backup scheduler:

```javascript
// Start auto-backup (runs every 24 hours)
offlineDB.startAutoBackup(24);

// Stop auto-backup
offlineDB.stopAutoBackup();
```

Configure auto-backup frequency in Settings:
- Daily
- Weekly
- Monthly
- Manual

---

## 📊 Database Statistics

The backup settings page shows real-time statistics:

- **Record Count** - Number of records per module
- **Data Size** - Storage size per module
- **Last Backup** - Timestamp of last backup
- **Backup Status** - Success/failure indicators

---

## 🛠️ Developer API

### Initialize All Databases

```javascript
import offlineDB from '@/utils/offlineDatabase';

// Initialize all databases
await offlineDB.initializeAll();
```

### Add Data

```javascript
// Add customer
await offlineDB.add('customers', 'customers', {
  id: 'cust_001',
  name: 'John Doe',
  phone: '1234567890',
  email: 'john@example.com'
});
```

### Get Data

```javascript
// Get all customers
const customers = await offlineDB.getAll('customers', 'customers');

// Get by ID
const customer = await offlineDB.getById('customers', 'customers', 'cust_001');

// Get by index
const results = await offlineDB.getByIndex('customers', 'customers', 'phone', '1234567890');
```

### Update Data

```javascript
await offlineDB.put('customers', 'customers', {
  id: 'cust_001',
  name: 'John Doe Updated',
  phone: '1234567890'
});
```

### Delete Data

```javascript
await offlineDB.delete('customers', 'customers', 'cust_001');
```

### Backup Operations

```javascript
// Backup single module
const result = await offlineDB.backupDatabase('customers');

// Backup all
const results = await offlineDB.backupAllDatabases();

// Restore single module
await offlineDB.restoreDatabase('customers');

// Restore all
await offlineDB.restoreAllDatabases();

// Export to JSON (in-memory)
const data = await offlineDB.exportDatabase('customers');

// Import from JSON
await offlineDB.importDatabase('customers', data);
```

### Statistics

```javascript
const stats = await offlineDB.getStatistics();

console.log(stats);
// {
//   customers: {
//     database: 'MalwaCRM_Customers',
//     stores: {
//       customers: { count: 150, size: 45600 },
//       contacts: { count: 230, size: 34200 }
//     }
//   },
//   ...
// }
```

---

## 🔐 Data Safety

### Backup Best Practices

1. **Regular Backups** - Set up daily auto-backup
2. **External Storage** - Copy `Data_Base` folder to USB/Cloud
3. **Multiple Copies** - Keep backups in multiple locations
4. **Test Restores** - Periodically test restore process
5. **Before Updates** - Always backup before software updates

### Data Retention

- Backups are never automatically deleted
- Manual deletion only through UI
- Keep minimum 3-7 days of backups
- Monthly archival recommended

---

## 🚀 Performance

### Optimizations

- **Indexed Queries** - All common fields are indexed
- **Batch Operations** - Bulk insert/update support
- **Lazy Loading** - Databases loaded on-demand
- **Efficient Storage** - Minimal overhead

### Scalability

- Each database can handle **millions** of records
- Tested with large datasets
- No performance degradation
- Browser storage limits: ~50MB-500MB (varies by browser)

---

## 🐛 Troubleshooting

### Backup Not Saving

**Problem:** Backup button completes but file not in folder

**Solution:**
1. Check if running in Electron (desktop app)
2. Verify folder permissions for `C:/malwa_crm/`
3. Check console for error messages
4. Try running app as administrator

### Restore Fails

**Problem:** Restore operation fails with error

**Solution:**
1. Verify backup file exists in `Data_Base` folder
2. Check backup file is valid JSON
3. Ensure file name matches pattern: `{DatabaseName}_backup.json`
4. Check file is not corrupted

### Database Not Initializing

**Problem:** Database operations fail with "not initialized" error

**Solution:**
1. Call `await offlineDB.initializeAll()` first
2. Check browser console for IndexedDB errors
3. Clear browser data and retry
4. Check if IndexedDB is blocked by browser settings

### Folder Not Created

**Problem:** `C:/malwa_crm/Data_Base/` folder not created

**Solution:**
1. Ensure running desktop app (not browser)
2. Check drive C: has space
3. Run app as administrator
4. Check antivirus/firewall settings

---

## 📝 File Naming Convention

All backup files follow this pattern:

```
{DatabaseName}_backup.json
```

Examples:
- `MalwaCRM_Customers_backup.json`
- `MalwaCRM_Sales_backup.json`
- `MalwaCRM_Inventory_backup.json`

**DO NOT** rename backup files manually.

---

## 🔗 Integration with Existing Code

The new offline database system is **separate** from the existing IndexedDB implementation (`src/utils/indexedDB.js`). Both can coexist:

- **Old System** (`indexedDB.js`) - Single database, current data
- **New System** (`offlineDatabase.js`) - Multiple databases, organized structure

**Migration is optional and not required for current functionality.**

---

## 📧 Support

For issues or questions:
- **Email:** malwatrolley@gmail.com
- **Phone:** +91 8224000822

---

## ✅ Summary

You now have a **production-ready offline database system** with:

✅ 10 separate IndexedDB databases
✅ 40+ organized object stores (tables)
✅ Automatic backup to `C:/malwa_crm/Data_Base/`
✅ Full restore capabilities
✅ Beautiful UI in Settings page
✅ File system integration (Electron)
✅ Individual and bulk operations
✅ Real-time statistics
✅ Automatic folder creation
✅ Auto-backup scheduler
✅ Complete data safety

**Your CRM data is safe, organized, and always backed up!** 🎉

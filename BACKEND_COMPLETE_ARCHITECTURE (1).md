# Malwa CRM Backend Complete Architecture

## 📋 Table of Contents
- [Overview](#overview)
- [Storage Architecture](#storage-architecture)
- [Electron Backend Layer](#electron-backend-layer)
- [Data Management System](#data-management-system)
- [State Management](#state-management)
- [Sync & Data Flow](#sync--data-flow)
- [Security & Authentication](#security--authentication)
- [File Structure Map](#file-structure-map)
- [API Reference](#api-reference)

---

## Overview

### System Architecture
Malwa CRM v4 is a **hybrid Electron desktop application** with:
- **Frontend**: React 18.2.0 + Vite
- **Desktop Framework**: Electron 39.2.3
- **Local Database**: IndexedDB with Dexie.js 4.2.1 (modern wrapper)
- **File System Storage**: C:/malwa-crm/Data_base/
- **State Management**: Zustand (lightweight)
- **UI Framework**: Tailwind CSS + shadcn/ui

### Core Design Principles
1. **Dual Storage Strategy**: IndexedDB with Dexie (primary in-memory) + File System (persistent backup)
2. **Offline-First**: Full functionality without network
3. **Auto-Sync**: Background synchronization between IndexedDB ↔ File System
4. **Module-Based**: 11 independent business modules
5. **Permission-Driven**: Role-based access control (RBAC)
6. **Reactive Data**: Live queries with automatic UI updates (Dexie.js)

---

## Storage Architecture

### Directory Structure
```
C:/malwa-crm/
└── Data_base/                      # Root data directory
    ├── meta.json                   # System metadata
    ├── Dashboard.json              # Dashboard data
    ├── Login.json                  # Login history
    ├── profiles/                   # User profiles & photos
    │   ├── {userId}.jpg            # Profile photos
    │   └── {userId}-profile.json   # Profile data
    ├── customer/                   # Customer module
    │   ├── customers.json
    │   ├── customer_ledger_entries.json
    │   ├── customer_jobs.json
    │   ├── invoices.json
    │   ├── invoice_items.json
    │   ├── receipts.json
    │   ├── cash_receipts.json
    │   └── documents.json
    ├── jobs/                       # Jobs module
    │   ├── jobs.json
    │   ├── inspections.json
    │   ├── estimates.json
    │   ├── estimate_items.json
    │   ├── jobsheets.json
    │   ├── jobsheet_items.json
    │   ├── challan.json
    │   ├── challan_items.json
    │   └── stock_transactions.json
    ├── vendors/                    # Vendor module
    │   ├── vendors.json
    │   ├── vendor_ledger_entries.json
    │   ├── vendor_services.json
    │   ├── service_orders.json
    │   ├── vendor_orders.json
    │   ├── vendor_invoices.json
    │   └── vendor_invoice_items.json
    ├── labour/                     # Labour module
    │   ├── labour.json
    │   ├── labour_ledger_entries.json
    │   ├── labour_attendance.json
    │   └── weekly_balances.json
    ├── supplier/                   # Supplier module
    │   ├── suppliers.json
    │   ├── supplier_ledger_entries.json
    │   └── supplier_products.json
    ├── inventory/                  # Inventory module
    │   ├── inventory_categories.json
    │   ├── inventory_items.json
    │   └── stock_movements.json
    ├── accounts/                   # Accounts module
    │   ├── accounts.json
    │   ├── vouchers.json
    │   ├── gstledger.json
    │   ├── purchase_challans.json
    │   ├── purchase_challan_items.json
    │   ├── sellchallan.json
    │   ├── sell_challan_items.json
    │   ├── journal_entries.json
    │   ├── journal_lines.json
    │   ├── gst_accounts.json
    │   └── ledger_views.json
    ├── settings/                   # Settings module
    │   ├── settings.json
    │   ├── meta.json
    │   ├── General/                # General settings subdirectory
    │   │   └── general_setting.json
    │   ├── My_Profile/             # User profile subdirectory
    │   │   ├── user_data.json
    │   │   └── user_image.json
    │   ├── Company_Master/         # Company info subdirectory
    │   │   └── company_master.json
    │   ├── Rate_List_Memory/       # Rate lists subdirectory
    │   │   └── rate_list_memory.json
    │   ├── User_Management/        # User management subdirectory
    │   │   ├── users.json
    │   │   ├── roles.json
    │   │   └── user_permissions.json
    │   ├── Security/               # Security settings subdirectory
    │   │   └── Pin_time.json
    │   ├── User_Login/             # Login access subdirectory
    │   │   └── user_limited_access.json
    │   └── Legacy/                 # Old structure (deprecated)
    │       ├── AboutTab.json
    │       ├── AuditLogsTab.json
    │       ├── BackupSettingsTab.json
    │       ├── CompanyMasterTab.json
    │       ├── GeneralSettingsTab.json
    │       ├── InvoiceSettingsTab.json
    │       ├── LedgerSettingsTab.json
    │       ├── MultiplierSettingsTab.json
    │       ├── MyProfileTab.json
    │       ├── RateListMemoryTab.json
    │       ├── SecuritySettingsTab.json
    │       ├── UserManagementTab.json
    │       ├── RateHistory.json
    │       ├── Templates.json
    │       ├── Roles.json
    │       ├── Permissions.json
    │       ├── Taxes.json
    │       ├── HsnCodes.json
    │       ├── AuditLogs.json
    │       └── Sequences.json
    ├── financial/                  # Financial data
    │   ├── payments.json
    │   └── products.json
    └── system/                     # System files
        ├── conflicts.json
        ├── offline_operations.json
        ├── syncQueue.json
        ├── job_operations_queue.json
        ├── system_logs.json
        ├── backup_history.json
        └── sync_status.json
```

### IndexedDB Structure
**Database**: `malwa_crm_db` (Version 17)  
**Database Wrapper**: Dexie.js 4.2.1

**Total Stores**: 91+ object stores organized by module

**Enhanced Features (Dexie.js)**:
- ✅ Compound indexes for multi-field queries (10-50x faster)
- ✅ Automatic timestamps (created_at, updated_at)
- ✅ Live queries for reactive UI updates
- ✅ Advanced query utilities (pagination, search, aggregation)
- ✅ Lifecycle hooks for sync automation
- ✅ Transaction safety with ACID compliance

#### Core System Stores
- `meta` - System metadata
- `profiles` - User profiles
- `users` - User accounts
- `conflicts` - Sync conflicts
- `offline_operations` - Offline operation queue
- `syncQueue` - Sync queue management
- `system_logs` - Application logs
- `backup_history` - Backup records
- `sync_status` - Sync status tracking

#### Customer Module (10 stores)
- `customers`
- `customer_ledger_entries`
- `customer_jobs`
- `invoices`
- `invoice_items`
- `receipts`
- `cash_receipts`
- `documents`

#### Jobs Module (10 stores)
- `jobs`
- `inspections`
- `estimates`
- `estimate_items`
- `jobsheets`
- `jobsheet_items`
- `challan`
- `challan_items`
- `stock_transactions`

#### Vendor Module (7 stores)
- `vendors`
- `vendor_ledger_entries`
- `vendor_services`
- `service_orders`
- `vendor_orders`
- `vendor_invoices`
- `vendor_invoice_items`

#### Labour Module (4 stores)
- `labour`
- `labour_ledger_entries`
- `labour_attendance`
- `weekly_balances`

#### Supplier Module (3 stores)
- `suppliers`
- `supplier_ledger_entries`
- `supplier_products`

#### Inventory Module (3 stores)
- `inventory_categories`
- `inventory_items`
- `stock_movements`

#### Accounts Module (12 stores)
- `accounts`
- `vouchers`
- `gstledger`
- `purchase_challans`
- `purchase_challan_items`
- `sellchallan`
- `sell_challan_items`
- `journal_entries`
- `journal_lines`
- `gst_accounts`
- `ledger_views`
- `purchases`
- `purchase_items`

#### Settings Module (12 stores)
- `settings`
- `branches`
- `roles`
- `permissions`
- `templates`
- `taxes`
- `hsn_codes`
- `audit_logs`
- `rate_history`
- `rate_list_memory`
- `sequences`
- `daily_tasks`

### NEW Settings Module Structure (v2.1)

The Settings module has been reorganized into subdirectories for better organization:

**Settings Root**:
- `C:/malwa-crm/Data_base/settings/settings.json` - Main settings file
- `C:/malwa-crm/Data_base/settings/meta.json` - Module metadata

**Subdirectories**:

1. **General/** - General application settings
   - `general_setting.json` - Theme, language, financial year, auto-save, etc.

2. **My_Profile/** - User profile data
   - `user_data.json` - User profile information
   - `user_image.json` - User profile photo (base64)

3. **Company_Master/** - Company information
   - `company_master.json` - Company details, logo, bank info, services, terms

4. **Rate_List_Memory/** - Rate lists and pricing
   - `rate_list_memory.json` - Rate lists with historical data

5. **User_Management/** - User and role management
   - `users.json` - User accounts and details
   - `roles.json` - User roles and hierarchies
   - `user_permissions.json` - Permission assignments

6. **Security/** - Security settings
   - `Pin_time.json` - PIN/password and session timeout settings

7. **User_Login/** - Login access control
   - `user_limited_access.json` - Limited access configurations

8. **Legacy/** - Old structure (backward compatibility)
   - Contains old tab-based JSON files (deprecated)


#### Financial Module (2 stores)
- `payments`
- `products`

---

## Electron Backend Layer

### File Location
**Primary File**: `electron/ipc-handlers.js` (662 lines)

### IPC Handler Categories

#### 1. Authentication & Security (Lines 1-60)
```javascript
// Handlers
- hash-password          // bcrypt password hashing (10 rounds)
- verify-password        // Password verification
- validate-session       // Session token validation
- check-permission       // RBAC permission check
```

**Features**:
- bcrypt (6.0.0) for secure password hashing
- Session management
- Permission-based access control

#### 2. Data Export/Import (Lines 61-150)
```javascript
// Handlers
- export-data            // Export with optional encryption
- import-data            // Import with decryption support
```

**Features**:
- AES-256-CBC encryption
- Dialog-based file selection
- JSON format with metadata

#### 3. Backup & Restore (Lines 151-220)
```javascript
// Handlers
- backup-database        // Full database backup
- restore-database       // Restore from backup
- fs-backup-database     // File system backup
- fs-restore-database    // File system restore
```

**Backup Format**:
```json
{
  "timestamp": "2024-11-24T10:30:00Z",
  "version": "2.0.0",
  "modules": {
    "customers": [...],
    "jobs": [...]
  }
}
```

#### 4. Audit Logging (Lines 221-235)
```javascript
// Handler
- log-audit              // Append-only audit log
```

**Audit Entry Format**:
```json
{
  "userId": "user-123",
  "action": "UPDATE_PROFILE",
  "timestamp": "2024-11-24T10:30:00Z",
  "details": {...}
}
```

#### 5. File System Operations (Lines 236-504)

**Basic Operations**:
```javascript
- fs-read-file           // Read from C:/malwa-crm/Data_base/
- fs-write-file          // Write to data directory
- fs-list-files          // List files with stats
- fs-delete-file         // Delete file
- fs-file-exists         // Check file existence
- fs-get-db-path         // Get database path
```

**Enhanced Operations**:
```javascript
- fs-ensure-dir          // Create directory recursively
- fs-path-exists         // Check any path existence
- fs-read-file-path      // Read from any path
- fs-write-file-path     // Write to any path with auto-dir
- fs-list-dir            // List any directory
```

#### 6. Profile Management (Lines 505-662)
```javascript
- profile-save-photo     // Save profile photo (JPG)
- profile-load-photo     // Load photo as base64
- profile-delete-photo   // Delete photo file
- profile-save-data      // Save profile JSON
- profile-load-data      // Load profile JSON
```

**Storage Paths**:
- Photos: `C:/malwa-crm/Data_base/profiles/{userId}.jpg`
- Data: `C:/malwa-crm/Data_base/profiles/{userId}-profile.json`

### Preload API Exposure

**File**: `electron/preload.js`

**Exposed APIs**:
```javascript
window.electron = {
  // App info
  getAppPath: () => Promise<string>,
  getDatabasePath: () => Promise<string>,
  getCustomDataPath: () => Promise<string>,
  getVersion: () => Promise<string>,
  platform: string,
  
  // Database
  ensureDirectory: (path) => Promise<Result>,
  initDbStructure: () => Promise<Result>,
  
  // Security
  hashPassword: (password) => Promise<Result>,
  verifyPassword: (password, hash) => Promise<Result>,
  validateSession: (token) => Promise<Result>,
  checkPermission: (userId, code) => Promise<Result>,
  
  // Data operations
  exportData: (data, encrypt) => Promise<Result>,
  importData: () => Promise<Result>,
  backupDatabase: (stores) => Promise<Result>,
  restoreDatabase: () => Promise<Result>,
  logAudit: (data) => Promise<Result>,
  
  // File system
  fs: {
    readFileOld: (fileName) => Promise<Result>,
    writeFileOld: (fileName, content) => Promise<Result>,
    listFiles: () => Promise<Result>,
    deleteFile: (fileName) => Promise<Result>,
    fileExists: (fileName) => Promise<Result>,
    getDbPath: () => Promise<Result>,
    backupDatabase: (data) => Promise<Result>,
    restoreDatabase: (fileName) => Promise<Result>,
    ensureDir: (dirPath) => Promise<Result>,
    pathExists: (filePath) => Promise<Result>,
    readFile: (filePath) => Promise<Result>,
    writeFile: (filePath, content) => Promise<Result>,
    listDir: (dirPath) => Promise<Result>
  },
  
  // Profile management
  profile: {
    savePhoto: (userId, photoData) => Promise<Result>,
    loadPhoto: (userId) => Promise<Result>,
    deletePhoto: (userId) => Promise<Result>,
    saveData: (userId, profileData) => Promise<Result>,
    loadData: (userId) => Promise<Result>
  }
}
```

---

## Data Management System

### Core Database Operations

**File**: `src/lib/db.js` (620+ lines)  
**Database Wrapper**: `src/db/dexie.js` (435+ lines)

#### Database Operations API
```javascript
dbOperations = {
  // CRUD Operations (Dexie-powered)
  getAll(storeName)                  // Get all records
  getById(storeName, id)             // Get by ID
  add(storeName, data)               // Add new record (auto-timestamps)
  update(storeName, id, data)        // Update record (auto-timestamps)
  delete(storeName, id)              // Delete record (audit logged)
  
  // Advanced Operations (NEW with Dexie)
  query(storeName, filterFn)         // Query with filter
  bulkAdd(storeName, dataArray)      // Bulk insert (transactional)
  bulkUpdate(storeName, updates)     // Bulk update (transactional)
  bulkDelete(storeName, ids)         // Bulk delete (transactional)
  count(storeName)                   // Count records
  clear(storeName)                   // Clear store
  
  // Transaction Support
  transaction(storeNames, mode, callback)
  
  // Sync Operations
  exportStore(storeName)             // Export to JSON
  importStore(storeName, data)       // Import from JSON
  syncWithFileSystem(storeName)      // Sync to file
}

// Advanced Query Utilities (NEW)
advancedQuery(storeName, filters)    // Filter with operators ($gt, $lt, $in, etc.)
paginate(storeName, options)         // Pagination with sorting
search(storeName, term, fields)      // Multi-field search
aggregate = {
  sum(storeName, field, filters)     // Sum aggregation
  avg(storeName, field, filters)     // Average aggregation
  count(storeName, filters)          // Count with filters
  groupBy(storeName, field)          // Group by aggregation
}

// Live Queries (NEW - Reactive Data)
liveQuery(querier)                   // Observable for automatic UI updates
```

#### Database Initialization
```javascript
// Auto-upgrade schema
DB_VERSION = 17

// Automatic store creation
STORES = {
  customers: 'id',
  jobs: 'id',
  // ... 91+ stores
}

// Migration on version change
onupgradeneeded = (event) => {
  // Create missing stores
  // Add indices
  // Migrate data
}
```

### File-Based Data Manager

**File**: `src/utils/fileDataManager.js` (359 lines)

#### Purpose
Maps IndexedDB stores to file system JSON files

#### Key Methods
```javascript
class FileBasedDataManager {
  // Initialize path mapping
  initializeMapping()
  
  // Get module file mapping
  getModuleMapping(moduleName)
  
  // Create directory structure
  initializeFileStructure()
  
  // Save data to file
  saveToFile(module, storeName, data)
  
  // Load data from file
  loadFromFile(module, storeName)
  
  // Sync operations
  syncModuleToFiles(moduleName)
  syncFilesToIndexedDB(moduleName)
  
  // Backup operations
  createBackup(moduleName)
  restoreBackup(backupFile)
}
```

#### Path Configuration
**File**: `src/utils/pathConfig.js`

```javascript
const pathConfig = {
  basePath: 'C:/malwa-crm/Data_base',
  modules: {
    customer: 'C:/malwa-crm/Data_base/customer',
    jobs: 'C:/malwa-crm/Data_base/jobs',
    vendors: 'C:/malwa-crm/Data_base/vendors',
    // ... all modules
  },
  fileMapping: {
    // Store name → File name mapping
    customers: 'customers.json',
    jobs: 'jobs.json',
    // ... all stores
  }
}
```

### Unified Sync Manager

**File**: `src/utils/unifiedSyncManager.js` (1327 lines)

#### Responsibilities
1. **Windows Installation Management**
2. **IndexedDB ↔ File System Sync**
3. **Online/Offline Sync**
4. **Job Queue Processing**
5. **Auto-Save Timer**
6. **Conflict Resolution**

#### Key Features
```javascript
class UnifiedSyncManager {
  // Core sync
  async syncStoreToFile(storeName)
  async syncFileToStore(storeName)
  async fullSync()
  
  // Auto-save
  startAutoSave()
  stopAutoSave()
  
  // Job queue
  processJobQueue()
  addToQueue(operation)
  
  // Conflict resolution
  resolveConflict(local, remote)
  
  // Status tracking
  getSyncStatus()
  getLastSyncTime()
}
```

#### Sync Flow
```
User Action (CRUD)
    ↓
IndexedDB Update
    ↓
Sync Queue Entry
    ↓
[30s Auto-Save Timer]
    ↓
File System Write
    ↓
Backup Creation (if enabled)
    ↓
Conflict Detection
    ↓
Resolution (timestamp-based)
```

### Desktop Sync Handler

**File**: `src/utils/desktopSyncHandler.js`

**Purpose**: Electron-specific sync operations

```javascript
class DesktopSyncHandler {
  // Electron IPC-based sync
  async syncToElectron(storeName, data)
  async syncFromElectron(storeName)
  
  // Watch file changes
  watchFileChanges(callback)
  
  // Direct file access
  readModuleFile(module, file)
  writeModuleFile(module, file, data)
}
```

---

## State Management

### Zustand Stores Architecture

All stores located in: `src/store/`

#### 1. Authentication Store
**File**: `authManagementStore.js` (527 lines)

```javascript
useAuthStore = {
  // State
  isAuthenticated: false,
  user: null,
  profile: null,
  permissions: [],
  
  // Actions
  login: (username, password) => Promise<Result>,
  logout: () => void,
  updateProfile: (updates) => Promise<Result>,
  loadPermissions: (userId) => Promise<Result>,
  checkPermission: (code) => boolean,
  
  // Preview mode
  enablePreviewMode: (userId) => void,
  disablePreviewMode: () => void,
}
```

**Profile Update Flow** (Enhanced):
```javascript
updateProfile: async (updates) => {
  // 1. Update Zustand state (optimistic UI)
  set({ profile: { ...currentProfile, ...updates } });
  
  // 2. Save to Electron file system
  if (window.electron?.profile?.saveData) {
    await window.electron.profile.saveData(userId, updatedProfile);
    
    // 3. Save photo separately if changed
    if (updates.photo) {
      await window.electron.profile.savePhoto(userId, updates.photo);
    }
  }
  
  // 4. Fallback to IndexedDB
  await dbOperations.update('profiles', userId, updatedProfile);
}
```

#### 2. Customer Store
**File**: `customerStore.js`

```javascript
useCustomerStore = {
  customers: [],
  ledgerEntries: [],
  jobs: [],
  invoices: [],
  receipts: [],
  
  // CRUD
  addCustomer: (data) => Promise<Result>,
  updateCustomer: (id, data) => Promise<Result>,
  deleteCustomer: (id) => Promise<Result>,
  
  // Ledger operations
  addLedgerEntry: (customerId, entry) => Promise<Result>,
  getLedgerBalance: (customerId) => number,
  
  // Invoice operations
  createInvoice: (customerId, items) => Promise<Result>,
  recordPayment: (invoiceId, amount) => Promise<Result>,
}
```

#### 3. Jobs Store
**File**: `jobsStore.js`

```javascript
useJobsStore = {
  jobs: [],
  inspections: [],
  estimates: [],
  jobsheets: [],
  challans: [],
  
  // Job lifecycle
  createJob: (data) => Promise<Result>,
  updateJobStatus: (id, status) => Promise<Result>,
  assignWorker: (jobId, labourId) => Promise<Result>,
  
  // Estimates
  createEstimate: (jobId, items) => Promise<Result>,
  approveEstimate: (estimateId) => Promise<Result>,
  
  // Jobsheets
  createJobsheet: (jobId, items) => Promise<Result>,
  completeJobsheet: (jobsheetId) => Promise<Result>,
}
```

#### 4. Vendor Store
**File**: `vendorStore.js`

```javascript
useVendorStore = {
  vendors: [],
  services: [],
  serviceOrders: [],
  ledgerEntries: [],
  
  addVendor: (data) => Promise<Result>,
  createServiceOrder: (vendorId, services) => Promise<Result>,
  recordPayment: (vendorId, amount) => Promise<Result>,
}
```

#### 5. Labour Store
**File**: `labourStore.js`

```javascript
useLabourStore = {
  labourers: [],
  attendance: [],
  weeklyBalances: [],
  ledgerEntries: [],
  
  addLabour: (data) => Promise<Result>,
  markAttendance: (labourId, date, status) => Promise<Result>,
  calculateWeeklyWages: (labourId, week) => Promise<Result>,
}
```

#### 6. Supplier Store
**File**: `supplierStore.js`

```javascript
useSupplierStore = {
  suppliers: [],
  products: [],
  ledgerEntries: [],
  
  addSupplier: (data) => Promise<Result>,
  addProduct: (supplierId, product) => Promise<Result>,
  recordPurchase: (supplierId, items) => Promise<Result>,
}
```

#### 7. Inventory Store
**File**: `inventoryStore.js`

```javascript
useInventoryStore = {
  categories: [],
  items: [],
  movements: [],
  
  addCategory: (data) => Promise<Result>,
  addItem: (categoryId, item) => Promise<Result>,
  adjustStock: (itemId, quantity, reason) => Promise<Result>,
  getStockLevel: (itemId) => number,
}
```

#### 8. Accounts Store
**File**: `accountsStore.js`

```javascript
useAccountsStore = {
  accounts: [],
  vouchers: [],
  gstLedger: [],
  purchaseChallans: [],
  sellChallans: [],
  
  createVoucher: (type, data) => Promise<Result>,
  recordGSTEntry: (data) => Promise<Result>,
  createPurchaseChallan: (items) => Promise<Result>,
  createSellChallan: (items) => Promise<Result>,
}
```

#### 9. Settings Store
**File**: `settingsStore.js`

```javascript
useSettingsStore = {
  settings: {},
  branches: [],
  users: [],
  roles: [],
  permissions: [],
  templates: [],
  taxes: [],
  
  updateSettings: (key, value) => Promise<Result>,
  addBranch: (data) => Promise<Result>,
  addUser: (data) => Promise<Result>,
  assignRole: (userId, roleId) => Promise<Result>,
  assignPermissions: (roleId, permissions) => Promise<Result>,
  
  // NEW Settings Structure Actions (v2.1)
  // General Settings
  saveGeneralSetting: (data) => Promise<Result>,
  loadGeneralSetting: () => Promise<Result>,
  
  // User Profile  
  saveUserProfile: (userId, profileData) => Promise<Result>,
  loadUserProfile: (userId) => Promise<Result>,
  saveUserImage: (userId, imageData) => Promise<Result>,
  loadUserImage: (userId) => Promise<Result>,
  
  // Company Master
  saveCompanyMaster: (data) => Promise<Result>,
  loadCompanyMaster: () => Promise<Result>,
  
  // Rate List Memory
  saveRateListMemory: (data) => Promise<Result>,
  loadRateListMemory: () => Promise<Result>,
  
  // User Management
  saveUsers: (users) => Promise<Result>,
  loadUsers: () => Promise<Result>,
  saveRoles: (roles) => Promise<Result>,
  loadRoles: () => Promise<Result>,
  saveUserPermissions: (permissions) => Promise<Result>,
  loadUserPermissions: () => Promise<Result>,
  
  // Security
  savePinTime: (data) => Promise<Result>,
  loadPinTime: () => Promise<Result>,
  
  // User Login
  saveUserLimitedAccess: (data) => Promise<Result>,
  loadUserLimitedAccess: () => Promise<Result>,
}
```

**Settings Backend Integration**:
The Settings module now uses a hierarchical file structure with dedicated subdirectories for each settings category. All save/load operations go through Electron IPC to persist data in the file system under `C:/malwa-crm/Data_base/settings/`.

**Migration Path**:
- Old structure files remain in `Legacy/` folder for backward compatibility
- Frontend components check new structure first, then fall back to legacy
- Data automatically migrates on first save to new structure


#### 10. Company Store
**File**: `companyStore.js`

```javascript
useCompanyStore = {
  company: {},
  
  updateCompanyInfo: (data) => Promise<Result>,
  uploadLogo: (file) => Promise<Result>,
}
```

#### 11. App State Store
**File**: `appStateStore.js`

```javascript
useAppStateStore = {
  isOnline: true,
  isSyncing: false,
  lastSyncTime: null,
  errors: [],
  notifications: [],
  
  setOnlineStatus: (status) => void,
  setSyncStatus: (status) => void,
  addError: (error) => void,
  clearErrors: () => void,
  addNotification: (notification) => void,
}
```

#### 12. Multiplier Store
**File**: `multiplierStore.js`

```javascript
useMultiplierStore = {
  rateListMemory: [],
  
  addRateList: (data) => Promise<Result>,
  updateRates: (listId, rates) => Promise<Result>,
  getRates: (listId) => Array,
}
```

---

## Sync & Data Flow

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE (React)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│              ZUSTAND STORES (State Management)              │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │  Auth    │ Customer │   Jobs   │  Vendor  │  Labour  │  │
│  ├──────────┼──────────┼──────────┼──────────┼──────────┤  │
│  │ Supplier │Inventory │ Accounts │ Settings │ AppState │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│              DATABASE OPERATIONS (dbOperations)             │
│                  CRUD + Query + Transaction                 │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                    INDEXEDDB (Browser)                      │
│              91+ Object Stores (In-Memory)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│              UNIFIED SYNC MANAGER                           │
│    Auto-Save | Conflict Resolution | Queue Processing      │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│            ELECTRON IPC HANDLERS (Main Process)             │
│              File System Operations + Security              │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│           FILE SYSTEM (C:/malwa-crm/Data_base/)             │
│              JSON Files (Persistent Storage)                │
└─────────────────────────────────────────────────────────────┘
```

### Sync Strategies

#### 1. Auto-Save (Periodic Sync)
```javascript
// Every 30 seconds
setInterval(() => {
  unifiedSyncManager.syncAllStores();
}, 30000);
```

#### 2. On-Demand Sync
```javascript
// User-triggered
button.onClick = () => {
  unifiedSyncManager.fullSync();
};
```

#### 3. Optimistic Updates
```javascript
// Update UI immediately
set({ data: newData });

// Sync in background
syncToFileSystem(newData).catch(error => {
  // Rollback on error
  set({ data: oldData });
});
```

#### 4. Conflict Resolution
```javascript
resolveConflict(local, remote) {
  // Timestamp-based (last write wins)
  if (local.updated_at > remote.updated_at) {
    return local;
  }
  return remote;
}
```

### Module Helpers

Each module has a dedicated helper file for business logic:

1. **Customer Module Helper** (`customerModuleHelpers.js`)
   - Invoice calculations
   - Payment tracking
   - Ledger balance computation

2. **Job Module Helper** (`jobModuleHelpers.js`)
   - Job status workflow
   - Estimate calculations
   - Jobsheet validation

3. **Vendor Module Helper** (`vendorModuleHelpers.js`)
   - Service order management
   - Payment scheduling
   - Ledger reconciliation

4. **Labour Module Helper** (`labourModuleHelpers.js`)
   - Attendance tracking
   - Wage calculations
   - Weekly balance computation

5. **Supplier Module Helper** (`supplierModuleHelpers.js`)
   - Product management
   - Purchase tracking
   - Ledger management

6. **Account Module Helper** (`accountModuleHelpers.js`)
   - Voucher processing
   - GST calculations
   - Challan management

7. **Settings Module Helper** (`settingsModuleHelpers.js`)
   - User management
   - Permission handling
   - Template processing

---

## Security & Authentication

### Password Security

**File**: `electron/ipc-handlers.js`

```javascript
// Bcrypt with 10 salt rounds
const SALT_ROUNDS = 10;

// Hash password
const hash = await bcrypt.hash(password, SALT_ROUNDS);

// Verify password
const isMatch = await bcrypt.compare(password, hash);
```

### Permission System

**File**: `src/utils/permissionHelpers.js`

#### Permission Structure
```javascript
{
  id: 'PERM_001',
  code: 'customer.create',
  name: 'Create Customer',
  module: 'customer',
  description: 'Allow creating new customers',
  category: 'write'
}
```

#### Permission Catalog
**File**: `src/utils/permissionCatalog.js`

**Categories**:
- Read permissions (view data)
- Write permissions (create/edit)
- Delete permissions (remove data)
- Admin permissions (system config)
- Report permissions (analytics)

**Total Permissions**: 100+ across all modules

#### RBAC Implementation
```javascript
// Check permission
const hasPermission = (userId, permissionCode) => {
  const userPermissions = getUserPermissions(userId);
  return userPermissions.includes(permissionCode);
};

// Permission guard (React component)
<PermissionGuard required="customer.create">
  <CreateCustomerButton />
</PermissionGuard>
```

### Session Management

```javascript
// Session structure
{
  userId: 'user-123',
  token: 'jwt-token-here',
  expiresAt: '2024-11-25T10:30:00Z',
  permissions: ['customer.read', 'jobs.write']
}

// Validate session
const isValid = validateSession(token);
if (!isValid) {
  logout();
}
```

### Audit Logging

**File**: `src/utils/errorLogger.js`

```javascript
// Log audit event
logAudit({
  userId: currentUser.id,
  action: 'DELETE_CUSTOMER',
  resourceId: customerId,
  timestamp: new Date().toISOString(),
  ipAddress: '192.168.1.1',
  userAgent: navigator.userAgent,
  details: { customerName: 'John Doe' }
});
```

**Storage**: `C:/malwa-crm/Data_base/settings/audit_logs.json`

---

## File Structure Map

### Backend Files Organization

```
malwa-crm-v4/
├── electron/                          # Electron main process
│   ├── main.js                        # Main entry point
│   ├── preload.js                     # Preload script (context bridge)
│   └── ipc-handlers.js                # IPC handlers (662 lines)
│
├── src/
│   ├── lib/                           # Core libraries
│   │   ├── db.js                      # IndexedDB operations (972 lines)
│   │   └── auth.js                    # Authentication logic
│   │
│   ├── store/                         # Zustand state stores
│   │   ├── authManagementStore.js     # Auth + Permissions (527 lines)
│   │   ├── customerStore.js           # Customer data
│   │   ├── jobsStore.js               # Jobs data
│   │   ├── vendorStore.js             # Vendor data
│   │   ├── labourStore.js             # Labour data
│   │   ├── supplierStore.js           # Supplier data
│   │   ├── inventoryStore.js          # Inventory data
│   │   ├── accountsStore.js           # Accounts data
│   │   ├── settingsStore.js           # Settings data
│   │   ├── companyStore.js            # Company data
│   │   ├── appStateStore.js           # App state
│   │   └── multiplierStore.js         # Rate lists
│   │
│   └── utils/                         # Utility functions
│       ├── unifiedSyncManager.js      # Main sync logic (1327 lines)
│       ├── fileDataManager.js         # File mapping (359 lines)
│       ├── desktopSyncHandler.js      # Electron sync
│       ├── pathConfig.js              # Path configuration
│       ├── pathManager.js             # Path management
│       ├── windowsInstallationManager.js  # Windows install
│       ├── permissionHelpers.js       # Permission utils
│       ├── permissionCatalog.js       # Permission definitions
│       ├── errorLogger.js             # Error logging
│       ├── enhancedDbOperations.js    # Advanced DB ops
│       ├── indexedDB.js               # IndexedDB wrapper
│       ├── offlineDatabase.js         # Offline support
│       ├── dataSync.js                # Sync utilities
│       ├── dataFlow.js                # Data flow management
│       ├── unifiedDataFlowManager.js  # Unified data flow
│       ├── moduleIntegration.js       # Module integration
│       ├── backendMigrationManager.js # Backend migration
│       ├── databaseFilesList.js       # Database file list
│       ├── pageDataManager.js         # Page data management
│       ├── customerModuleHelpers.js   # Customer logic
│       ├── jobModuleHelpers.js        # Jobs logic
│       ├── vendorModuleHelpers.js     # Vendor logic
│       ├── labourModuleHelpers.js     # Labour logic
│       ├── supplierModuleHelpers.js   # Supplier logic
│       ├── accountModuleHelpers.js    # Account logic
│       ├── settingsModuleHelpers.js   # Settings logic
│       ├── calculations.js            # Business calculations
│       ├── dashboardCalculations.js   # Dashboard metrics
│       ├── penaltyCalculations.js     # Penalty computation
│       ├── inputValidation.js         # Input validation
│       ├── dateFormatter.js           # Date utilities
│       ├── exportHelpers.js           # Export utilities
│       ├── ledgerExports.js           # Ledger exports
│       ├── rateListMemory.js          # Rate list cache
│       ├── adminSetup.js              # Admin setup
│       ├── systemTester.js            # System testing
│       ├── dbDiagnostics.js           # DB diagnostics
│       ├── analytics.js               # Analytics
│       ├── globalErrorHandler.js      # Global error handler
│       └── animationErrorHandler.js   # Animation errors
│
├── docs/                              # Documentation
│   ├── BACKEND_COMPLETE_ARCHITECTURE.md    # This file
│   ├── PROFILE_BACKEND_STRUCTURE.md        # Profile backend
│   ├── PROFILE_TESTING_GUIDE.md            # Testing guide
│   ├── UNIFIED_BACKEND_PATTERN.md          # Backend pattern
│   ├── UNIFIED_SYNC_MANAGER_MERGE.md       # Sync manager
│   ├── BACKEND_UNIFICATION_SUCCESS.md      # Unification
│   └── WINDOWS_INSTALLATION.md             # Installation
│
└── test/                              # Test files
    └── installationTester.js          # Installation tests
```

### Configuration Files

```
malwa-crm-v4/
├── package.json                       # Dependencies & scripts
├── vite.config.js                     # Vite configuration
├── electron-builder.json              # Electron builder config
├── tailwind.config.js                 # Tailwind CSS config
├── postcss.config.js                  # PostCSS config
├── indexeddb_file_mapping.json        # DB to file mapping
└── public/
    ├── manifest.json                  # PWA manifest
    └── indexeddb_file_mapping.json    # Public mapping copy
```

---

## API Reference

### Database Operations API

```typescript
// Get all records
dbOperations.getAll(storeName: string): Promise<Array<any>>

// Get by ID
dbOperations.getById(storeName: string, id: string): Promise<any>

// Add record
dbOperations.add(storeName: string, data: object): Promise<string>

// Update record
dbOperations.update(storeName: string, id: string, data: object): Promise<void>

// Delete record
dbOperations.delete(storeName: string, id: string): Promise<void>

// Query records
dbOperations.query(storeName: string, filterFn: Function): Promise<Array<any>>

// Bulk operations
dbOperations.bulkAdd(storeName: string, dataArray: Array<object>): Promise<Array<string>>
dbOperations.bulkUpdate(storeName: string, updates: Array<{id, data}>): Promise<void>
dbOperations.bulkDelete(storeName: string, ids: Array<string>): Promise<void>

// Count
dbOperations.count(storeName: string): Promise<number>

// Clear store
dbOperations.clear(storeName: string): Promise<void>

// Export/Import
dbOperations.exportStore(storeName: string): Promise<string>
dbOperations.importStore(storeName: string, jsonData: string): Promise<void>
```

### Electron IPC API

```typescript
// Authentication
window.electron.hashPassword(password: string): Promise<{success: boolean, hash: string}>
window.electron.verifyPassword(password: string, hash: string): Promise<{success: boolean, isMatch: boolean}>

// File System
window.electron.fs.readFile(filePath: string): Promise<{success: boolean, data: string}>
window.electron.fs.writeFile(filePath: string, content: string): Promise<{success: boolean, path: string}>
window.electron.fs.listDir(dirPath: string): Promise<{success: boolean, files: Array<FileInfo>}>
window.electron.fs.pathExists(filePath: string): Promise<{success: boolean, exists: boolean}>
window.electron.fs.ensureDir(dirPath: string): Promise<{success: boolean, path: string}>

// Profile Management
window.electron.profile.savePhoto(userId: string, photoData: string): Promise<{success: boolean, photoPath: string}>
window.electron.profile.loadPhoto(userId: string): Promise<{success: boolean, photoData: string}>
window.electron.profile.deletePhoto(userId: string): Promise<{success: boolean}>
window.electron.profile.saveData(userId: string, profileData: object): Promise<{success: boolean, profilePath: string}>
window.electron.profile.loadData(userId: string): Promise<{success: boolean, profileData: object}>

// Backup/Restore
window.electron.backupDatabase(stores: object): Promise<{success: boolean, filePath: string}>
window.electron.restoreDatabase(): Promise<{success: boolean, data: object}>

// Export/Import
window.electron.exportData(data: object, encrypt: boolean): Promise<{success: boolean, filePath: string}>
window.electron.importData(): Promise<{success: boolean, data: object}>
```

### Sync Manager API

```typescript
class UnifiedSyncManager {
  // Initialize
  initialize(): Promise<void>
  
  // Sync operations
  syncStoreToFile(storeName: string): Promise<{success: boolean}>
  syncFileToStore(storeName: string): Promise<{success: boolean}>
  fullSync(): Promise<{success: boolean, stats: object}>
  
  // Auto-save
  startAutoSave(interval: number): void
  stopAutoSave(): void
  
  // Status
  getSyncStatus(): SyncStatus
  getLastSyncTime(): Date
  
  // Queue management
  addToQueue(operation: object): void
  processJobQueue(): Promise<void>
  clearQueue(): void
  
  // Event listeners
  addEventListener(event: string, callback: Function): void
  removeEventListener(event: string, callback: Function): void
}
```

### Permission API

```typescript
// Check permission
checkPermission(userId: string, permissionCode: string): boolean

// Get user permissions
getUserPermissions(userId: string): Promise<Array<Permission>>

// Assign permissions
assignPermissions(userId: string, permissionCodes: Array<string>): Promise<void>

// Permission structure
interface Permission {
  id: string
  code: string
  name: string
  module: string
  category: 'read' | 'write' | 'delete' | 'admin' | 'report'
  description: string
}
```

---

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**
   - Modules loaded on demand
   - Images lazy loaded
   - Code splitting with React.lazy()

2. **Caching**
   - Rate list memory cache
   - IndexedDB query cache
   - File path cache

3. **Batch Operations**
   - Bulk inserts instead of individual
   - Transaction batching
   - File write batching

4. **Debouncing**
   - Search input debounced (300ms)
   - Auto-save debounced (30s)
   - Sync operations debounced

5. **Virtual Scrolling**
   - Large lists use virtual scroll
   - Reduces DOM nodes
   - Improves rendering performance

### Memory Management

```javascript
// Cleanup on unmount
useEffect(() => {
  return () => {
    // Clear timers
    clearInterval(autoSaveTimer);
    
    // Remove listeners
    syncManager.removeAllListeners();
    
    // Clear caches
    rateListMemory.clear();
  };
}, []);
```

---

## Error Handling

### Global Error Handler

**File**: `src/utils/globalErrorHandler.js`

```javascript
window.addEventListener('error', (event) => {
  errorLogger.log({
    type: 'RUNTIME_ERROR',
    message: event.message,
    stack: event.error?.stack,
    filename: event.filename,
    lineno: event.lineno,
    timestamp: new Date().toISOString()
  });
});

window.addEventListener('unhandledrejection', (event) => {
  errorLogger.log({
    type: 'UNHANDLED_PROMISE_REJECTION',
    reason: event.reason,
    timestamp: new Date().toISOString()
  });
});
```

### Error Logger

**File**: `src/utils/errorLogger.js`

```javascript
class ErrorLogger {
  log(error) {
    // Log to console
    console.error(error);
    
    // Save to IndexedDB
    dbOperations.add('system_logs', {
      ...error,
      id: generateId(),
      timestamp: new Date().toISOString()
    });
    
    // Show user notification
    toast.error(error.message);
  }
  
  // Get error logs
  getLogs(filters) {
    return dbOperations.query('system_logs', filters);
  }
}
```

---

## Testing

### Test Structure

**File**: `test/installationTester.js`

```javascript
class InstallationTester {
  async testInstallationStatus() { }
  async testFreshInstallation() { }
  async testExistingInstallation() { }
  async testFileCreation() { }
  async testFolderCreation() { }
  async testDatabaseSync() { }
  async testPermissions() { }
  async testBackupRestore() { }
}
```

### Manual Testing Checklist

- [ ] Fresh installation creates directory structure
- [ ] Data saves to IndexedDB
- [ ] Data syncs to file system
- [ ] Profile photo upload/download works
- [ ] Backup/restore works
- [ ] Permissions are enforced
- [ ] Offline mode works
- [ ] Auto-save works (30s interval)
- [ ] Conflict resolution works
- [ ] Error logging works

---

## Deployment

### Build Process

```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Build Electron app
npm run electron:build

# Output: release/Malwa-CRM-Setup-2.0.0-x64.exe (91.93 MB)
```

### Installation

```
1. Run installer: Malwa-CRM-Setup-2.0.0-x64.exe
2. Installer creates: C:/malwa-crm/Data_base/
3. Installer creates 11 module folders
4. App launches and initializes IndexedDB
5. Auto-sync starts (30s interval)
```

### System Requirements

- **OS**: Windows 10/11 (64-bit)
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 500MB for app, 1GB for data
- **Node.js**: Not required (bundled)

---

## Maintenance

### Backup Strategy

1. **Automatic Backups**
   - Daily at 2:00 AM
   - Stored in `C:/malwa-crm/Data_base/backups/`
   - Retention: 30 days

2. **Manual Backups**
   - User-triggered from Settings
   - Choose location via dialog
   - Full or selective module backup

### Database Migration

**File**: `src/utils/backendMigrationManager.js`

```javascript
class MigrationManager {
  async migrate(fromVersion, toVersion) {
    const migrations = this.getMigrations(fromVersion, toVersion);
    
    for (const migration of migrations) {
      await migration.up();
    }
  }
  
  async rollback(fromVersion, toVersion) {
    const migrations = this.getMigrations(toVersion, fromVersion);
    
    for (const migration of migrations.reverse()) {
      await migration.down();
    }
  }
}
```

### Log Rotation

```javascript
// Rotate logs when size exceeds 10MB
if (logFileSize > 10 * 1024 * 1024) {
  const archive = `logs-${Date.now()}.json`;
  fs.rename('system_logs.json', archive);
  fs.writeFile('system_logs.json', '[]');
}
```

---

## Troubleshooting

### Common Issues

**Issue**: "Failed to update profile"
**Solution**: Check `C:/malwa-crm/Data_base/profiles/` permissions

**Issue**: "Database sync failed"
**Solution**: Check disk space, verify `C:/malwa-crm/` exists

**Issue**: "Permission denied"
**Solution**: Check user role and assigned permissions

**Issue**: "IndexedDB quota exceeded"
**Solution**: Clear old data, increase browser quota

### Debug Mode

Enable debug logging:
```javascript
// In src/lib/db.js
const DEBUG_MODE = true;
```

Check console for:
- `[DB:ADD] customers {...}`
- `[DB:UPDATE] jobs {...}`
- `[SYNC] Syncing customers to file`
- `[ERROR] Failed to write file`

---

## Future Enhancements

### Planned Features

1. **Cloud Sync**
   - Sync data to cloud storage
   - Multi-device support
   - Real-time collaboration

2. **Mobile App**
   - React Native mobile app
   - Offline-first design
   - Sync with desktop

3. **Advanced Reporting**
   - Custom report builder
   - Export to Excel/PDF
   - Scheduled reports

4. **API Integration**
   - REST API for external systems
   - Webhook support
   - Third-party integrations

5. **AI Features**
   - Predictive analytics
   - Automated suggestions
   - Natural language queries

---

## Conclusion

This document provides a comprehensive overview of the Malwa CRM backend architecture. The system is designed for:

✅ **Reliability**: Dual storage (IndexedDB + File System)  
✅ **Performance**: Optimistic updates, caching, batching  
✅ **Security**: bcrypt, RBAC, audit logging  
✅ **Scalability**: Modular design, 91+ stores  
✅ **Offline Support**: Full functionality without network  
✅ **Developer Experience**: Clear APIs, comprehensive docs  

For specific implementation details, refer to the individual module documentation files.

---

**Last Updated**: November 24, 2024  
**Version**: 2.0.0  
**Database Version**: 17  
**Electron Version**: 39.2.3

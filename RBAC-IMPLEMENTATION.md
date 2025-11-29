# Role-Based Access Control (RBAC) Implementation

## Overview
Complete role-based permission system implemented across the entire Malwa CRM project. Every module, sidebar item, and page component follows dynamic role-based permissions.

## Implemented Features

### ✅ 1. Role Definitions
Located in: `src/utils/roleDefinitions.js`

All roles are defined with complete page access mappings:

| Role | God Mode | GST-Only | Features |
|------|----------|----------|----------|
| **Super Admin** | ✅ Yes | ❌ No | Full unconditional access to everything |
| **Admin** | ❌ No | ✅ Yes | GST-filtered data visibility only |
| **Manager** | ❌ No | ❌ No | Full operational management access |
| **Accountant** | ❌ No | ❌ No | Financial operations and reporting |
| **Employee** | ❌ No | ❌ No | Basic operational access |

### ✅ 2. Page Access Matrix

#### Super Admin
- **Access**: God mode - all pages, all subpages, all features
- **Restrictions**: None
- **Bypass**: All permission checks bypassed

#### Admin (GST-Only Mode)
- ✅ Jobs: Inspection Step, Estimate Step, Job Sheet Step, Invoice Step
- ✅ Customer: Customer Details, Customer Ledger
- ✅ Labour: Labour Details, Labour Ledger
- ✅ Supplier: Supplier Details, Supplier Ledger
- ✅ Accounts: Purchase, Other Expenses, Invoice
- ✅ Settings: General, My Profile, Security, About
- ⛔ Dashboard: No access
- ⛔ Vendors: No access
- ⛔ Inventory: No access
- **Special**: Only GST-bearing data visible (filters by gst, gstin, gst_rate, gst_amount, cgst, sgst, igst, ugst)
- **Login**: Auto-fills email as `malwatrolley@gmail.com`

#### Manager
- ✅ All modules: Jobs, Customer, Vendors, Labour, Supplier, Inventory, Accounts
- ✅ All subpages except Settings > User Management
- ✅ Full data visibility (no filters)

#### Accountant
- ✅ Same as Manager but excludes Settings > Company Master
- ✅ Financial focus with ledger access across all modules

#### Employee
- ✅ Customer: Customer Details only
- ✅ Labour: Labour Details, Labour Ledger
- ✅ Supplier: Supplier Ledger only
- ✅ Accounts: Purchase, Voucher, Other Expenses, Challan
- ✅ Daily Tasks
- ✅ Settings: General, My Profile, Security, About

### ✅ 3. GST-Only Data Filtering (Admin Role)
Located in: `src/utils/gstFilter.js`, `src/hooks/useGstFilter.js`

**Implementation**:
```javascript
// Check GST keys in data
const GST_KEYS = ['gst', 'gstin', 'gst_rate', 'gst_amount', 'cgst', 'sgst', 'igst', 'ugst'];

// Filter records
const filtered = data.filter(record => hasGstField(record));

// Filter table columns
const columns = filterGstColumns(allColumns);
```

**Usage in Components**:
```javascript
import { useGstFilter, useGstOnlyMode } from '@/hooks/useGstFilter';

const MyComponent = () => {
  const filteredData = useGstFilter(rawData);
  const isGstMode = useGstOnlyMode();
  
  // Render only GST data if in GST mode
  return <Table data={filteredData} />;
};
```

### ✅ 4. Login Auto-Fill
Located in: `src/pages/Login.jsx`

- On mount, email field auto-fills with `malwatrolley@gmail.com`
- Last login email persisted to `localStorage['lastLoginEmail']`
- Admin role users get auto-fill by default

### ✅ 5. Permission-Based Routing
Located in: `src/components/withPermission.jsx`, `src/hooks/usePageAccess.js`

**HOC Pattern**:
```javascript
import { withPermission } from '@/components/withPermission';

const ProtectedPage = () => {
  // Page component
};

export default withPermission(ProtectedPage, 'jobs', 'inspectionStep');
```

**Guard Component**:
```javascript
import PageAccessGuard from '@/components/PageAccessGuard';

<Route path="/jobs" element={
  <PageAccessGuard pageKey="jobs">
    <JobsPage />
  </PageAccessGuard>
} />
```

### ✅ 6. Sidebar Filtering
Located in: `src/components/Sidebar.jsx`

- Dynamically filters menu items based on role permissions
- Hides pages/subpages user doesn't have access to
- Uses `usePageAccess` hook for real-time permission checks

### ✅ 7. Role Management UI
Located in: `src/pages/settings/UserManagementTab.jsx`

- Role selection dropdown populated from role definitions
- Page access automatically populated based on selected role
- Roles loaded from `getAllRoles()` function
- User creation automatically applies role-based page access

### ✅ 8. Authentication Store Integration
Located in: `src/store/authManagementStore.js`

- Sets `gstOnlyMode` flag for Admin role on login
- Integrates with role definitions via `isGstOnlyRole()`
- Profile updated with GST mode flag automatically

## File Structure

```
src/
├── utils/
│   ├── roleDefinitions.js       # Core role definitions and access rules
│   └── gstFilter.js              # GST-only data filtering logic
├── hooks/
│   ├── usePageAccess.js          # Role-based page access hook
│   └── useGstFilter.js           # GST filtering hooks
├── components/
│   ├── withPermission.jsx        # HOC for page protection
│   ├── PageAccessGuard.jsx       # Route guard component
│   └── Sidebar.jsx               # Dynamic sidebar with role filtering
├── pages/
│   ├── Login.jsx                 # Auto-fill email for Admin
│   └── settings/
│       └── UserManagementTab.jsx # Role management UI
└── store/
    └── authManagementStore.js    # Auth state with role integration
```

## Usage Examples

### Example 1: Protect a Page
```javascript
import { withPermission } from '@/components/withPermission';

const CustomerPage = () => {
  return <div>Customer Management</div>;
};

export default withPermission(CustomerPage, 'customer');
```

### Example 2: Check Access in Component
```javascript
import { usePageAccess } from '@/hooks/usePageAccess';

const MyComponent = () => {
  const { hasAccess } = usePageAccess();
  
  if (!hasAccess('jobs', 'invoiceStep')) {
    return <div>No access to invoice</div>;
  }
  
  return <div>Invoice Page</div>;
};
```

### Example 3: GST Filtering
```javascript
import { useGstFilter, useGstOnlyMode } from '@/hooks/useGstFilter';

const DataTable = ({ data }) => {
  const filteredData = useGstFilter(data);
  const isGstMode = useGstOnlyMode();
  
  return (
    <div>
      {isGstMode && <p>Showing GST records only</p>}
      <Table data={filteredData} />
    </div>
  );
};
```

### Example 4: Role-Based Rendering
```javascript
import { useAuthStore } from '@/store/authManagementStore';
import { isGodMode } from '@/utils/roleDefinitions';

const AdminPanel = () => {
  const { profile } = useAuthStore();
  
  if (isGodMode(profile?.role)) {
    return <div>God Mode Active - Full Control Panel</div>;
  }
  
  return <div>Limited Control Panel</div>;
};
```

## Testing Verification

### Test Scenario 1: Super Admin
1. Login with Super Admin credentials
2. ✅ Verify all sidebar items visible
3. ✅ Verify all pages accessible
4. ✅ Verify no data filtering applied
5. ✅ Verify full access to User Management

### Test Scenario 2: Admin (GST-Only)
1. Login - email auto-fills as `malwatrolley@gmail.com`
2. ✅ Verify only specified pages in sidebar
3. ✅ Verify tables show only GST-bearing records
4. ✅ Verify columns filtered to GST fields only
5. ✅ Navigate to blocked page → redirected to dashboard

### Test Scenario 3: Manager
1. Login with Manager credentials
2. ✅ Verify operational pages visible
3. ✅ Verify User Management hidden in Settings
4. ✅ Verify full data access (no GST filter)

### Test Scenario 4: Accountant
1. Login with Accountant credentials
2. ✅ Verify ledger access across all modules
3. ✅ Verify Company Master hidden
4. ✅ Verify financial pages fully accessible

### Test Scenario 5: Employee
1. Login with Employee credentials
2. ✅ Verify limited Customer access (Details only)
3. ✅ Verify Labour and Supplier ledger access
4. ✅ Verify Accounts pages available
5. ✅ Verify Dashboard and Summary hidden

## Deliverables Status

| Deliverable | Status | Location |
|-------------|--------|----------|
| Role Definitions | ✅ Complete | `src/utils/roleDefinitions.js` |
| Dynamic Sidebar Filtering | ✅ Complete | `src/components/Sidebar.jsx` |
| Page-level Permission Guards | ✅ Complete | `src/components/withPermission.jsx` |
| GST Filter for Admin | ✅ Complete | `src/utils/gstFilter.js` |
| Login Auto-fill | ✅ Complete | `src/pages/Login.jsx` |
| Role Management UI | ✅ Complete | `src/pages/settings/UserManagementTab.jsx` |
| Permission Hooks | ✅ Complete | `src/hooks/usePageAccess.js`, `src/hooks/useGstFilter.js` |
| Auth Store Integration | ✅ Complete | `src/store/authManagementStore.js` |

## Summary

✅ **RBAC Fully Implemented**
- All 5 roles defined with exact permissions
- Page access enforced at routing and component level
- GST-only filtering active for Admin role
- Login auto-fill for Admin email
- Dynamic sidebar based on role
- User management syncs with role definitions
- God mode for Super Admin bypasses all checks

**System is production-ready for role-based access control.**

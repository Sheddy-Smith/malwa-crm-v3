# Malwa CRM - Complete Data Flow & Connectivity Guide

## 🔄 System Architecture Overview

This document explains the complete data flow and connectivity between all modules in the Malwa CRM system.

---

## 📊 Core Data Flow Diagram

```
START (Job Creation)
    ↓
INSPECTION → Customer Details Captured
    ↓
ESTIMATE → Multipliers Applied → Inventory Referenced
    ↓
JOB SHEET → Work Assignment (Labour/Vendor)
    ↓
CHALLAN → Stock Movement Recorded
    ↓
INVOICE → Customer Ledger Updated → GST Calculated
    ↓
CASH RECEIPT → Payment Recorded → Ledger Updated
    ↓
ACCOUNTS → P-Invoice, Voucher, Purchase, Sell-Challan, GST Ledger
```

---

## 🎯 Module Connectivity

### 1. **Job Module → Customer Module**
- **Flow**: Job creation automatically creates/links customer
- **Data Sync**:
  - Customer name, contact, vehicle details
  - Automatic customer ledger creation
  - Lead conversion tracking

**Example**:
```javascript
import { createLedgerEntry } from '@/utils/dataFlow';

// When job is created
createLedgerEntry('customer', customerId, customerName, 0, 'New customer from job');
```

---

### 2. **Estimate → Inventory Integration**
- **Flow**: Estimate pulls items from inventory with multipliers
- **Data Sync**:
  - Real-time stock availability check
  - Category-based multiplier application
  - Rate fetching from inventory

**Example**:
```javascript
import { calculateItemTotal } from '@/utils/dataFlow';
import useMultiplierStore from '@/store/multiplierStore';

const multiplierStore = useMultiplierStore.getState();
const item = {
  name: "Bumper",
  rate: 5000,
  quantity: 2,
  category: "Parts",
  workBy: "Labour"
};

const total = calculateItemTotal(item);
// Applies category multiplier from Settings
```

---

### 3. **Estimate → Challan Generation**
- **Flow**: Estimate converts to delivery/purchase challan
- **Data Sync**:
  - Parts list transferred
  - Stock movement created
  - Vendor/Supplier selection

**Example**:
```javascript
import { createChallanFromEstimate, createStockMovement } from '@/utils/dataFlow';

const challan = createChallanFromEstimate(job, 'sell');
// Creates challan and records stock movement
```

---

### 4. **Challan → Inventory Stock Movement**
- **Flow**: Challan automatically updates inventory levels
- **Data Sync**:
  - Stock reduction (sell challan)
  - Stock addition (purchase challan)
  - Movement history tracking

**Example**:
```javascript
import { updateInventoryFromEstimate, createStockMovement } from '@/utils/dataFlow';

// When challan is finalized
updateInventoryFromEstimate(challanItems);

// Record movement
createStockMovement(
  item.id,
  item.name,
  'out',
  quantity,
  'Sold via Challan',
  challanNumber
);
```

---

### 5. **Job → Invoice Generation**
- **Flow**: Complete job converts to final invoice
- **Data Sync**:
  - All estimate items included
  - GST calculation
  - Customer ledger updated

**Example**:
```javascript
import { createInvoiceFromJob } from '@/utils/dataFlow';

const invoice = createInvoiceFromJob(job);
// Creates invoice + updates customer ledger automatically
```

---

### 6. **Invoice → Customer Ledger**
- **Flow**: Invoice creates debit entry in customer ledger
- **Data Sync**:
  - Amount receivable recorded
  - GST tracked separately
  - Payment pending status

**Example**:
```javascript
import { createLedgerEntry } from '@/utils/dataFlow';

createLedgerEntry(
  'customer',
  customerId,
  customerName,
  invoiceAmount,
  `Invoice #${invoiceNumber}`
);
```

---

### 7. **Cash Receipt → Ledger Update**
- **Flow**: Payment receipt creates credit entry
- **Data Sync**:
  - Outstanding balance reduced
  - Payment mode recorded
  - Receipt number generated

**Example**:
```javascript
import { recordReceipt, getCustomerBalance } from '@/utils/dataFlow';

recordReceipt(customerId, customerName, amount, 'Cash');
const balance = getCustomerBalance(customerId);
```

---

### 8. **Purchase → Supplier Ledger**
- **Flow**: Purchase creates credit entry for supplier
- **Data Sync**:
  - Amount payable recorded
  - Inventory increased
  - Purchase challan linked

**Example**:
```javascript
import { recordPurchase } from '@/utils/dataFlow';

recordPurchase(supplierName, purchaseItems, totalAmount);
// Updates supplier ledger + inventory
```

---

### 9. **Vendor Work → Vendor Ledger**
- **Flow**: Vendor work assignment creates payable entry
- **Data Sync**:
  - Labour/work cost recorded
  - Vendor multiplier applied
  - Payment tracking

**Example**:
```javascript
import { createLedgerEntry } from '@/utils/dataFlow';

createLedgerEntry(
  'vendor',
  vendorId,
  vendorName,
  -workCost,
  `Work done for Job #${jobNumber}`
);
```

---

### 10. **Labour → Labour Ledger**
- **Flow**: Labour assignment creates payable entry
- **Data Sync**:
  - Labour cost with multiplier
  - Payment tracking
  - Work history

---

### 11. **All Transactions → GST Ledger**
- **Flow**: Every invoice/challan updates GST tracking
- **Data Sync**:
  - Output GST (sales)
  - Input GST (purchases)
  - Net GST calculation

**Example**:
```javascript
import { generateGSTReport } from '@/utils/dataFlow';

const gstData = generateGSTReport('2025-01-01', '2025-03-31');
// Returns: { outputGST, inputGST, netGST, totalSales, totalPurchases }
```

---

## 🔧 Settings → Global Impact

### Multiplier Settings
- **Labour Multiplier**: Applied to all labour items across jobs
- **Vendor Multiplier**: Applied to vendor work assignments
- **Category Multipliers**: Applied based on inventory category
- **Priority**: Category > Work Type (Labour/Vendor)

### Invoice Settings
- **Prefixes**: Applied to all invoices, challans, receipts
- **GST Mode**: Affects all calculations
- **Terms & Conditions**: Added to all documents

### Inventory Settings
- **Valuation Method (FIFO/LIFO)**: Affects cost calculations
- **Low Stock Alerts**: Triggers notifications
- **Auto Stock Update**: Controls inventory sync

---

## 📈 Live Dashboard Data Sources

The dashboard aggregates data from:

1. **Jobs Store** → Total jobs, active jobs, completed jobs
2. **Customer Store** → Total customers, leads, contacts
3. **Inventory Store** → Total items, low stock alerts
4. **Ledger Store** → Receivables, payables, cash flow
5. **Vendor/Supplier Stores** → Pending payments

---

## 🔐 Data Persistence

### LocalStorage (Zustand Persist)
- Customer data
- Vendor data
- Supplier data
- Inventory stock
- Job details
- Settings & multipliers
- Ledger entries

### Supabase Database (Available)
- User authentication
- Multi-user access
- Cloud backup
- Real-time sync
- Role-based permissions

---

## 🚀 Usage Examples

### Complete Job Flow

```javascript
// 1. Create Job
const job = {
  customerName: "ABC Motors",
  vehicleNumber: "PB01AB1234",
  inspection: {...},
};

// 2. Add Estimate with Multipliers
const estimateItem = {
  name: "Front Bumper",
  rate: 5000,
  quantity: 1,
  category: "Parts", // Multiplier from settings
  workBy: "Labour"
};

// 3. Generate Challan
const challan = createChallanFromEstimate(job, 'sell');

// 4. Create Invoice
const invoice = createInvoiceFromJob(job);

// 5. Record Payment
recordReceipt(customerId, customerName, amount, 'Cash');

// 6. Check Balance
const balance = getCustomerBalance(customerId);
```

---

## 📊 Reporting & Analytics

### Available Reports
1. **Customer Ledger** - Individual customer transactions
2. **Vendor Ledger** - Vendor payment tracking
3. **Supplier Ledger** - Purchase tracking
4. **Labour Ledger** - Labour cost analysis
5. **GST Report** - Tax liability calculation
6. **Stock Movement** - Inventory tracking
7. **Job Report** - Job profitability
8. **Cash Flow** - Income vs expenses

---

## 🎨 UI/UX Flow

```
Sidebar Navigation
├── Dashboard (Overview)
├── Customer (Leads → Contacts → Ledger)
├── Jobs (Inspection → Estimate → Job Sheet → Challan → Invoice)
├── Inventory (Stock → Categories → Movement)
├── Vendor (Details → Ledger)
├── Supplier (Details → Ledger)
├── Labour (Details → Ledger)
├── Accounts
│   ├── Invoice
│   ├── Challan
│   ├── Purchase
│   ├── Voucher
│   ├── GST Ledger
│   └── Cash Receipt
├── Summary (Reports & Analytics)
└── Settings
    ├── General
    ├── User Management
    ├── Multiplier Settings ⭐
    ├── Ledger & Accounting
    ├── Inventory & Stock
    ├── Invoice & Billing
    ├── Backup & Data
    └── Security
```

---

## 🔄 Data Flow Helper Functions

Import from `@/utils/dataFlow`:

```javascript
// Calculations
calculateItemTotal(item)
calculateEstimateTotal(items)
calculateWithMultiplier(amount, quantity, category, workBy)

// Inventory
updateInventoryFromEstimate(items)
createStockMovement(id, name, type, qty, reason, ref)

// Ledger
createLedgerEntry(type, id, name, amount, description)
getCustomerBalance(customerId)
getVendorBalance(vendorId)
getSupplierBalance(supplierId)

// Conversions
syncJobToInvoice(job)
createInvoiceFromJob(job)
createChallanFromEstimate(job, type)

// Transactions
recordPurchase(supplier, items, amount)
recordPayment(type, id, name, amount, mode)
recordReceipt(customerId, name, amount, mode)

// Reports
generateGSTReport(startDate, endDate)
getStockMovements(itemId)
```

---

## ✅ Best Practices

1. **Always use helper functions** from `dataFlow.js` for consistency
2. **Apply multipliers** through settings, not hardcoded
3. **Record stock movements** for every inventory transaction
4. **Update ledgers** for all financial transactions
5. **Generate GST reports** regularly for compliance
6. **Backup data** frequently using Settings → Backup
7. **Use Supabase** for multi-user environments
8. **Test flow** before going live

---

## 🎯 Future Enhancements

- Real-time notifications
- WhatsApp integration
- Email invoicing
- SMS alerts
- Cloud sync automation
- Mobile app connectivity
- Advanced analytics
- AI-powered insights

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Maintained by**: Malwa CRM Development Team

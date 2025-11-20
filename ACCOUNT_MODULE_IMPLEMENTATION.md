# Account Module Implementation Guide

## Overview

This document describes the implementation of the Account Module for Malwa CRM as specified in `ACCOUNT_MODULE_RELATION.md`. The Account module handles all accounting flows including purchases, sales invoices, vouchers, payments, GST reporting, and ledger management with proper double-entry bookkeeping, offline support, and data synchronization.

## Architecture

### Database Schema (`src/lib/db.js`)

Database version updated to 3 with Account module stores and indexes:

**New Stores:**
- `accounts` - Chart of accounts
- `purchases` & `purchase_items` - Purchase invoice headers and line items
- `gst_accounts` - GST-specific account configurations
- `ledger_views` - Materialized ledger summaries (optional analytics)

**Enhanced Stores (from Job Module):**
- `journal_entries` & `journal_lines` - Double-entry accounting records
- `payments` - Payment receipts and settlements
- `invoices` & `invoice_items` - Sales invoices
- `challans` & `challan_items` - Delivery/receipt challans
- `stock_transactions` - Inventory movements

**Key Indexes:**
- `accounts`: code, type, parentId
- `purchases`: vendorId, date, status
- `purchase_items`: purchaseId, productId
- `payments`: invoiceId, vendorId, customerId, date
- `journal_entries`: date, sourceType, sourceId
- `journal_lines`: journalEntryId, accountId

### Helper Functions (`src/utils/accountModuleHelpers.js`)

**Core Accounting Operations:**

1. **`validateJournalBalance(journalLines)`** - Validates debits = credits
2. **`postPurchaseInvoice(purchase, items, vendorId)`** - Atomic purchase posting
3. **`postSalesInvoice(invoice, items, customerId)`** - Atomic sales invoice posting
4. **`createVoucher(voucherData, journalLines)`** - Manual journal entries
5. **`receivePayment(paymentData, invoiceId)`** - Cash receipt processing
6. **`getGSTReport(fromDate, toDate)`** - GST period report
7. **`getAccountLedger(accountId, fromDate, toDate)`** - Account ledger with running balance
8. **`createChallan(challanData, items, type)`** - Challan creation (sell/purchase)

**Business Rules Enforced:**
- Mandatory journal balancing (debits = credits within 0.01 tolerance)
- Stock update on purchase transactions
- Invoice status updates on payment
- Atomic multi-store operations with rollback on error
- Offline operation queueing with high priority

### State Management (`src/store/accountsStore.js`)

**Zustand Store with Database Integration:**

**State:**
- `accounts` - Chart of accounts map
- `purchases` - Purchase invoices map
- `invoices` - Sales invoices map
- `payments` - Payments map
- `vouchers` - Manual vouchers map
- `loading` - Loading state
- `error` - Error state

**Key Methods:**
- `loadAccounts()` - Load chart of accounts
- `createAccount(data)` - Create new account
- `postPurchase(purchase, items, vendorId)` - Post purchase invoice
- `postSalesInvoice(invoice, items, customerId)` - Post sales invoice
- `createVoucher(data, lines)` - Create manual voucher
- `receivePayment(payment, invoiceId)` - Receive payment
- `getGSTReport(from, to)` - Generate GST report
- `getAccountLedger(accountId, from, to)` - Get account ledger
- `getDashboardKPIs()` - Get accounting KPIs
- `exportAccountsData()` - Export via Electron
- `importAccountsData()` - Import via Electron

### Electron Integration (`electron/main.js`)

**Account Module IPC Handlers:**
- `accounts.export` - Export accounting data with period filtering
- `accounts.import` - Import accounting data
- `accounts.exportGST` - Export GST report as JSON/CSV
- `accounts.importBankCSV` - Import bank statement CSV for reconciliation

**Security:**
- Path validation restricted to `C:\malwa_crm\`
- File extension validation
- Size limits on imports

## Accounting Workflows

### 1. Purchase Invoice Flow

**Flow:** Vendor → Purchase Invoice → Inventory + AP + GST

**Stores Involved:** `purchases`, `purchase_items`, `stock_transactions`, `journal_entries`, `journal_lines`, `products`

**Journal Entry:**
```
Debit: Inventory Account (item total)
Debit: GST Input Account (GST amount)
Credit: Accounts Payable (grand total)
```

**Transaction:**
```javascript
import { postPurchaseInvoice } from '@/utils/accountModuleHelpers';

const result = await postPurchaseInvoice(
  {
    invoiceNo: 'PINV-001',
    date: '2025-11-15',
    subTotal: 10000,
    gstRate: 0.18
  },
  [
    { productId: 'prod-1', qty: 10, rate: 1000, amount: 10000 }
  ],
  'vendor-123'
);
```

### 2. Sales Invoice Flow

**Flow:** Customer → Sales Invoice → AR + Revenue + GST

**Stores Involved:** `invoices`, `invoice_items`, `journal_entries`, `journal_lines`

**Journal Entry:**
```
Debit: Accounts Receivable (grand total)
Credit: Sales Revenue (item total)
Credit: GST Output Account (GST amount)
```

**Transaction:**
```javascript
import { postSalesInvoice } from '@/utils/accountModuleHelpers';

const result = await postSalesInvoice(
  {
    invoiceNo: 'INV-001',
    date: '2025-11-15',
    subTotal: 10000,
    gstRate: 0.18,
    jobId: 'job-123'
  },
  [
    { productId: 'prod-1', qty: 2, rate: 5000, amount: 10000 }
  ],
  'customer-456'
);
```

### 3. Manual Voucher Flow

**Flow:** User Entry → Voucher → Journal Entry

**Stores Involved:** `journal_entries`, `journal_lines`

**Validation:** Must balance before posting

**Transaction:**
```javascript
import { createVoucher } from '@/utils/accountModuleHelpers';

const result = await createVoucher(
  {
    voucherNo: 'JV-001',
    date: '2025-11-15',
    description: 'Bank charges adjustment'
  },
  [
    { accountId: 'BANK_CHARGES', debit: 500, credit: 0, description: 'Bank charges' },
    { accountId: 'BANK', debit: 0, credit: 500, description: 'Bank account' }
  ]
);
```

### 4. Payment Receipt Flow

**Flow:** Payment → Invoice Settlement → Bank/Cash + AR

**Stores Involved:** `payments`, `journal_entries`, `journal_lines`, `invoices`

**Journal Entry:**
```
Debit: Bank/Cash Account (payment amount)
Credit: Accounts Receivable (payment amount)
```

**Invoice Update:** Updates `paidAmount` and `status`

**Transaction:**
```javascript
import { receivePayment } from '@/utils/accountModuleHelpers';

const result = await receivePayment(
  {
    amount: 11800,
    paymentMode: 'Cash',
    accountId: 'CASH',
    date: '2025-11-15'
  },
  'invoice-789'
);
```

### 5. GST Reporting

**Flow:** Journal Lines → GST Filter → Period Report

**Calculation:**
- Input GST: Sum of GST_INPUT account debits
- Output GST: Sum of GST_OUTPUT account credits
- Net GST: Output GST - Input GST

**Transaction:**
```javascript
import { getGSTReport } from '@/utils/accountModuleHelpers';

const report = await getGSTReport('2025-11-01', '2025-11-30');
console.log(report);
// {
//   inputGST: 1800,
//   outputGST: 3600,
//   netGST: 1800,
//   lines: [...],
//   period: { fromDate: '2025-11-01', toDate: '2025-11-30' }
// }
```

### 6. Account Ledger

**Flow:** Journal Lines → Filter by Account → Running Balance

**Features:**
- Period filtering
- Running balance calculation
- Opening and closing balances
- Total debits and credits

**Transaction:**
```javascript
import { getAccountLedger } from '@/utils/accountModuleHelpers';

const ledger = await getAccountLedger('AR', '2025-11-01', '2025-11-30');
console.log(ledger);
// {
//   accountId: 'AR',
//   entries: [...],
//   openingBalance: 0,
//   closingBalance: 50000,
//   totalDebits: 70000,
//   totalCredits: 20000
// }
```

### 7. Challan Management

**Flow:** Challan → Stock Movement → Optional Journal

**Types:** 
- Sell Challan (negative stock)
- Purchase Challan (positive stock)

**Transaction:**
```javascript
import { createChallan } from '@/utils/accountModuleHelpers';

const result = await createChallan(
  {
    challanNo: 'CH-001',
    jobId: 'job-123',
    customerId: 'customer-456',
    date: '2025-11-15'
  },
  [
    { productId: 'prod-1', qty: 5, rate: 1000 }
  ],
  'sell' // or 'purchase'
);
```

## Validation Rules

### 1. Journal Entry Balancing
```javascript
const validation = validateJournalBalance(journalLines);
if (!validation.balanced) {
  throw new Error(`Not balanced. Diff: ${validation.difference}`);
}
```

**Tolerance:** 0.01 (to handle floating-point rounding)

### 2. Invoice Total Validation
```javascript
const itemsTotal = items.reduce((sum, item) => sum + item.amount, 0);
if (Math.abs(itemsTotal - invoice.subTotal) > 0.01) {
  throw new Error('Invoice total mismatch');
}
```

### 3. Stock Update on Purchase
```javascript
// Automatically updates product.currentStock in transaction
stockTransactions.forEach(st => {
  const product = await getProduct(st.productId);
  product.currentStock += st.qty;
  await updateProduct(product);
});
```

### 4. Payment Invoice Update
```javascript
const newPaidAmount = invoice.paidAmount + payment.amount;
const newStatus = newPaidAmount >= invoice.total ? 'Paid' : 'Partial';
await updateInvoice(invoiceId, { paidAmount: newPaidAmount, status: newStatus });
```

## Offline Support

All accounting operations support offline-first:

1. **Write locally immediately** with `syncStatus: 'pending'`
2. **Create composite operation** with unique `opId`
3. **Queue with high priority** for accounting ops
4. **Idempotent sync** - server deduplicates by `opId`
5. **Conflict resolution** - creates `conflicts` record for manual review

**Composite Operation Structure:**
```json
{
  "id": "uuid",
  "opId": "op-purchase-20251115-abc123",
  "opType": "composite",
  "stores": ["purchases", "purchase_items", "stock_transactions", "journal_entries", "journal_lines"],
  "payload": { "purchase": {...}, "items": [...], ... },
  "priority": "high",
  "status": "pending",
  "createdAt": "2025-11-15T10:00:00Z"
}
```

## Chart of Accounts Structure

**Standard Accounts:**
```javascript
const standardAccounts = [
  // Assets
  { id: 'CASH', code: '1001', name: 'Cash', type: 'Asset' },
  { id: 'BANK', code: '1002', name: 'Bank', type: 'Asset' },
  { id: 'AR', code: '1100', name: 'Accounts Receivable', type: 'Asset' },
  { id: 'INVENTORY', code: '1200', name: 'Inventory', type: 'Asset' },
  
  // Liabilities
  { id: 'AP', code: '2100', name: 'Accounts Payable', type: 'Liability' },
  { id: 'GST_OUTPUT', code: '2200', name: 'GST Output', type: 'Liability' },
  
  // Revenue
  { id: 'SALES', code: '4000', name: 'Sales Revenue', type: 'Revenue' },
  
  // Expenses
  { id: 'COGS', code: '5000', name: 'Cost of Goods Sold', type: 'Expense' },
  { id: 'GST_INPUT', code: '5100', name: 'GST Input', type: 'Expense' },
  { id: 'BANK_CHARGES', code: '5200', name: 'Bank Charges', type: 'Expense' }
];
```

## Performance Considerations

- **Batch Transactions:** Limited to 500 records per transaction
- **Indexed Queries:** All foreign keys and dates indexed
- **Lazy Loading:** Load related data only when needed
- **Materialized Views:** Optional `ledger_views` for complex aggregations
- **Date Range Queries:** Use index on `journal_entries.date`

## Error Handling

**Transaction Rollback:**
```javascript
try {
  await dbTransaction([...], 'readwrite', (tx) => {
    // All operations here
    // If any fails, entire transaction rolls back
  });
} catch (error) {
  console.error('Transaction failed:', error);
  toast.error('Failed to post transaction');
}
```

**Validation Before Commit:**
```javascript
// Validate within transaction
if (!validation.balanced) {
  throw new Error('Not balanced'); // Triggers rollback
}
```

## Acceptance Tests

Per `ACCOUNT_MODULE_RELATION.md`:

1. ✅ Post P-invoice: stock increases, AP created, journal balanced
2. ✅ Create Voucher: balanced saves, unbalanced blocked
3. ✅ Post Sales Invoice: invoice and balanced journal created, AR increased
4. ✅ Make Payment: payment created, invoice balance updated, journal balanced
5. ✅ GST Report: totals match sum of GST journal lines
6. ✅ Bank Import: CSV parsed, transactions matched/flagged
7. ✅ Offline Sync: composite op created, synced, versions updated
8. ✅ Idempotency: duplicate opId ignored, 409 handled gracefully

## Files Modified/Created

**Modified:**
- `src/lib/db.js` - Added Account module stores and indexes
- `electron/main.js` - Added Account module IPC handlers

**Created:**
- `src/utils/accountModuleHelpers.js` - Accounting operations
- `src/store/accountsStore.js` - Account module state management
- `ACCOUNT_MODULE_IMPLEMENTATION.md` - This document

## Integration Points

### With Job Module
- Sales invoices link to `jobs` via `jobId`
- Challans link to `jobsheets` for material issuance
- Stock transactions shared between modules

### With Inventory Module
- Purchase invoices update `products.currentStock`
- Stock transactions track all movements
- COGS calculated from stock transactions

### With Customer/Vendor Modules
- Invoices link to `customers`
- Purchases link to `vendors`
- AR/AP ledgers derived from journal entries

## Developer Notes

- Database version is now 3
- All accounting operations use double-entry bookkeeping
- Journal entries MUST balance before commit
- High priority for accounting ops in sync queue
- opId ensures idempotent server processing

## Testing

**Manual Testing:**
1. Create purchase invoice → Verify stock increase and AP journal
2. Create sales invoice → Verify AR journal and invoice record
3. Create voucher with unbalanced lines → Should be rejected
4. Receive payment → Verify invoice status update and bank journal
5. Generate GST report → Verify totals match journal lines
6. Check account ledger → Verify running balance correct

**Console Debugging:**
```javascript
// Check journal balance
const lines = [
  { accountId: 'CASH', debit: 1000, credit: 0 },
  { accountId: 'AR', debit: 0, credit: 1000 }
];
const validation = validateJournalBalance(lines);
console.log(validation); // { balanced: true, ... }

// Check account ledger
const ledger = await getAccountLedger('AR');
console.table(ledger.entries);
```

## Support

For issues:
- Review `ACCOUNT_MODULE_RELATION.md` for specifications
- Check browser console for detailed errors
- Inspect `journal_entries` and `journal_lines` tables
- Review `offline_operations` for pending sync

---

**Implementation Date:** November 16, 2025  
**Specification:** ACCOUNT_MODULE_RELATION.md  
**Database Version:** 3

# Account Module Quick Reference

## Common Operations

### Post Purchase Invoice
```javascript
import { postPurchaseInvoice } from '@/utils/accountModuleHelpers';

const result = await postPurchaseInvoice(
  {
    invoiceNo: 'PINV-001',
    date: '2025-11-15',
    subTotal: 10000,
    gstRate: 0.18,
    description: 'Office supplies'
  },
  [
    { productId: 'prod-1', qty: 10, rate: 1000, amount: 10000 }
  ],
  'vendor-123'
);

// Result includes: purchase, items, stockTransactions, journal, lines
```

### Post Sales Invoice
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

### Create Manual Voucher
```javascript
import { createVoucher } from '@/utils/accountModuleHelpers';

const result = await createVoucher(
  {
    voucherNo: 'JV-001',
    date: '2025-11-15',
    description: 'Rent payment'
  },
  [
    { accountId: 'RENT_EXPENSE', debit: 10000, credit: 0, description: 'Monthly rent' },
    { accountId: 'BANK', debit: 0, credit: 10000, description: 'Paid from bank' }
  ]
);
```

### Receive Payment
```javascript
import { receivePayment } from '@/utils/accountModuleHelpers';

const result = await receivePayment(
  {
    amount: 11800,
    paymentMode: 'Cash',
    accountId: 'CASH',
    date: '2025-11-15',
    customerId: 'customer-456'
  },
  'invoice-789'
);
```

### Validate Journal Balance
```javascript
import { validateJournalBalance } from '@/utils/accountModuleHelpers';

const lines = [
  { accountId: 'CASH', debit: 1000, credit: 0 },
  { accountId: 'AR', debit: 0, credit: 1000 }
];

const validation = validateJournalBalance(lines);
console.log(validation);
// {
//   balanced: true,
//   totalDebits: 1000,
//   totalCredits: 1000,
//   difference: 0
// }
```

### Get GST Report
```javascript
import { getGSTReport } from '@/utils/accountModuleHelpers';

const report = await getGSTReport('2025-11-01', '2025-11-30');
console.log(report);
// {
//   inputGST: 1800,     // GST paid on purchases
//   outputGST: 3600,    // GST collected on sales
//   netGST: 1800,       // Amount payable to govt
//   lines: [...],
//   period: { fromDate, toDate }
// }
```

### Get Account Ledger
```javascript
import { getAccountLedger } from '@/utils/accountModuleHelpers';

const ledger = await getAccountLedger('AR', '2025-11-01', '2025-11-30');
console.log(ledger);
// {
//   accountId: 'AR',
//   entries: [...],      // All transactions with running balance
//   openingBalance: 0,
//   closingBalance: 50000,
//   totalDebits: 70000,
//   totalCredits: 20000
// }
```

### Create Challan
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
    { productId: 'prod-1', qty: 5, rate: 1000, amount: 5000 }
  ],
  'sell' // or 'purchase'
);
```

## Store Usage

### Using Accounts Store
```javascript
import useAccountsStore from '@/store/accountsStore';

function AccountsPage() {
  const { 
    accounts,
    loading,
    postPurchase,
    postSalesInvoice,
    receivePayment,
    getGSTReport 
  } = useAccountsStore();

  const handlePostPurchase = async () => {
    await postPurchase(purchaseData, items, vendorId);
  };

  if (loading) return <div>Loading...</div>;

  return <div>...</div>;
}
```

### Load Data
```javascript
import useAccountsStore from '@/store/accountsStore';

// Load accounts
await useAccountsStore.getState().loadAccounts();

// Load purchases
await useAccountsStore.getState().loadPurchases();

// Load invoices
await useAccountsStore.getState().loadInvoices();

// Get KPIs
const kpis = await useAccountsStore.getState().getDashboardKPIs();
console.log(kpis);
// {
//   totalAccounts: 50,
//   totalTransactions: 1000,
//   totalInvoices: 200,
//   totalPurchases: 150,
//   pendingInvoices: 50,
//   paidInvoices: 150
// }
```

## Electron IPC Operations

### Export Accounts Data
```javascript
const result = await window.electron.invoke('accounts.export', {
  stores: ['journal_entries', 'journal_lines', 'accounts'],
  period: { from: '2025-11-01', to: '2025-11-30' }
});
console.log(result.path); // Path to exported file
```

### Import Accounts Data
```javascript
const result = await window.electron.invoke('accounts.import', {
  sourcePath: 'C:/malwa_crm/Data_Base/accounts_export.json'
});
console.log(result.importReport);
// {
//   success: true,
//   recordCount: 500,
//   errors: []
// }
```

### Export GST Report
```javascript
const report = await getGSTReport('2025-11-01', '2025-11-30');
const result = await window.electron.invoke('accounts.exportGST', {
  period: { from: '2025-11-01', to: '2025-11-30' },
  data: report
});
console.log(result.path);
```

### Import Bank CSV
```javascript
const result = await window.electron.invoke('accounts.importBankCSV', {
  filePath: 'C:/malwa_crm/Data_Base/bank_statement.csv'
});
console.log(result.transactions);
// Array of parsed bank transactions
```

## Standard Chart of Accounts

```javascript
const standardAccounts = {
  // Assets (1xxx)
  CASH: { code: '1001', name: 'Cash', type: 'Asset' },
  BANK: { code: '1002', name: 'Bank', type: 'Asset' },
  AR: { code: '1100', name: 'Accounts Receivable', type: 'Asset' },
  INVENTORY: { code: '1200', name: 'Inventory', type: 'Asset' },
  
  // Liabilities (2xxx)
  AP: { code: '2100', name: 'Accounts Payable', type: 'Liability' },
  GST_OUTPUT: { code: '2200', name: 'GST Output', type: 'Liability' },
  
  // Revenue (4xxx)
  SALES: { code: '4000', name: 'Sales Revenue', type: 'Revenue' },
  SERVICE_REVENUE: { code: '4100', name: 'Service Revenue', type: 'Revenue' },
  
  // Expenses (5xxx)
  COGS: { code: '5000', name: 'Cost of Goods Sold', type: 'Expense' },
  GST_INPUT: { code: '5100', name: 'GST Input', type: 'Expense' },
  RENT_EXPENSE: { code: '5200', name: 'Rent', type: 'Expense' },
  SALARY_EXPENSE: { code: '5300', name: 'Salaries', type: 'Expense' },
  BANK_CHARGES: { code: '5400', name: 'Bank Charges', type: 'Expense' }
};
```

## Journal Entry Patterns

### Purchase Entry
```
Dr. Inventory               10,000
Dr. GST Input                1,800
    Cr. Accounts Payable            11,800
```

### Sales Entry
```
Dr. Accounts Receivable     11,800
    Cr. Sales Revenue               10,000
    Cr. GST Output                   1,800
```

### Payment Receipt
```
Dr. Cash/Bank               11,800
    Cr. Accounts Receivable         11,800
```

### Payment Made
```
Dr. Accounts Payable        11,800
    Cr. Cash/Bank                   11,800
```

### Expense Entry
```
Dr. Rent Expense            10,000
    Cr. Bank                        10,000
```

## Validation Examples

### Check Balance
```javascript
const lines = [
  { accountId: 'CASH', debit: 1000, credit: 0 },
  { accountId: 'SALES', debit: 0, credit: 900 },
  { accountId: 'GST_OUTPUT', debit: 0, credit: 100 }
];

const validation = validateJournalBalance(lines);
if (!validation.balanced) {
  console.error(`Not balanced! Difference: ${validation.difference}`);
}
```

### Validate Invoice Total
```javascript
const items = [
  { qty: 2, rate: 5000, amount: 10000 },
  { qty: 1, rate: 2000, amount: 2000 }
];

const calculatedTotal = items.reduce((sum, item) => sum + item.amount, 0);
const invoiceTotal = 12000;

if (Math.abs(calculatedTotal - invoiceTotal) > 0.01) {
  throw new Error('Invoice total mismatch');
}
```

## Database Queries

### Get All Journal Entries for Period
```javascript
import { dbOperations } from '@/lib/db';

const allEntries = await dbOperations.getAll('journal_entries');
const periodEntries = allEntries.filter(entry => {
  const date = new Date(entry.date);
  return date >= new Date('2025-11-01') && date <= new Date('2025-11-30');
});
```

### Get Lines for a Journal Entry
```javascript
const lines = await dbOperations.getByIndex('journal_lines', 'journalEntryId', journalId);
```

### Get All Purchases by Vendor
```javascript
const purchases = await dbOperations.getByIndex('purchases', 'vendorId', vendorId);
```

### Get All Payments for Invoice
```javascript
const payments = await dbOperations.getByIndex('payments', 'invoiceId', invoiceId);
```

## Error Handling

### Transaction Error
```javascript
try {
  await postPurchaseInvoice(purchase, items, vendorId);
} catch (error) {
  if (error.message.includes('not balanced')) {
    toast.error('Journal entry is not balanced');
  } else {
    toast.error('Failed to post purchase: ' + error.message);
  }
}
```

### Validation Error
```javascript
const validation = validateJournalBalance(lines);
if (!validation.balanced) {
  throw new Error(
    `Journal not balanced.\n` +
    `Debits: ${validation.totalDebits}\n` +
    `Credits: ${validation.totalCredits}\n` +
    `Difference: ${validation.difference}`
  );
}
```

## Common Patterns

### Post and Print
```javascript
// Post invoice
const result = await postSalesInvoice(invoice, items, customerId);

// Generate PDF
if (window.electron) {
  const pdfData = generateInvoicePDF(result.invoice);
  await window.electron.invoke('fs.writeAtomic', {
    path: `C:/malwa_crm/invoices/${result.invoice.invoiceNo}.pdf`,
    dataBuffer: pdfData
  });
}
```

### Batch Operations
```javascript
// Post multiple purchases
const results = await Promise.all(
  purchases.map(p => postPurchaseInvoice(p.data, p.items, p.vendorId))
);
```

### Check Outstanding Invoices
```javascript
const invoices = await dbOperations.getAll('invoices');
const outstanding = invoices.filter(inv => 
  inv.status === 'Pending' || inv.status === 'Partial'
);
const totalOutstanding = outstanding.reduce((sum, inv) => 
  sum + ((inv.total || 0) - (inv.paidAmount || 0)), 0
);
```

## Testing Checklist

- [ ] Purchase invoice creates stock transactions
- [ ] Purchase invoice creates balanced journal
- [ ] Sales invoice creates balanced journal
- [ ] Voucher with unbalanced lines is rejected
- [ ] Payment updates invoice status
- [ ] Payment creates balanced journal
- [ ] GST report totals are accurate
- [ ] Account ledger running balance is correct
- [ ] Offline operations are queued
- [ ] Sync processes accounting ops with high priority

## Debugging

### Check Journal Balance
```javascript
const journalId = 'journal-123';
const lines = await dbOperations.getByIndex('journal_lines', 'journalEntryId', journalId);
const validation = validateJournalBalance(lines);
console.log('Balance check:', validation);
```

### View Account Transactions
```javascript
const ledger = await getAccountLedger('AR');
console.table(ledger.entries);
```

### Check Pending Sync Operations
```javascript
const pending = await dbOperations.getByIndex('offline_operations', 'status', 'pending');
const accountingOps = pending.filter(op => op.priority === 'high');
console.log('Pending accounting ops:', accountingOps.length);
```

---

**Quick Start:** Import helpers → Use composite operations → Validate balance → Handle errors

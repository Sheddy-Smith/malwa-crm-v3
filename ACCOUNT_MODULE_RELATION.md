# ACCOUNT_MODULE_RELATION.md

## Purpose

This document maps the **Accounts** module and all related pages exactly according to the diagram you supplied. It is an authoritative developer-facing spec for implementing the Accounts flows using **IndexedDB (renderer)** and **Electron (main)**. The file includes store mappings, indexes, page-by-page read/write behavior, transaction sequences, Electron IPC actions, sync/offline rules, QA acceptance tests and a developer handoff checklist.

Use this file as the single source of truth when implementing Accounts, GST, Cash Receipt and related ledger functionality.

---

## Top-level flow (as in image)

The image shows Accounts as the hub connecting Inventory, Job/Invoice flows, Vendors/Suppliers, Labour and final Cash Receipt. The canonical flow (flattened) is:

```
Start → Job/Invoice flows → Customer → Ledger
                        ↘
                         Accounts Module ← Inventory (stock movement)
                        ↗   ↘
           Vendor/Purchase -> Purch-challan -> Purchase Accounting
                        ↘
                       GST-Ledger
                        ↘
                     Cash Receipt
```

But to match the exact image we will break this into pages and directional arrows covered below.

---

## Primary IndexedDB stores used by Accounts module

* `accounts` (chart of accounts)
* `journal_entries`
* `journal_lines`
* `invoices`
* `invoice_items`
* `purchases`
* `purchase_items`
* `challans` / `challan_items` (both sell & purchase challans)
* `payments`
* `stock_transactions`
* `products`
* `vendors` / `suppliers`
* `customers`
* `gst_accounts` (or `accounts` with `type=gst`)
* `ledger_views` (optional materialized/analytics)
* `offline_operations`
* `meta`
* `conflicts`

**Critical indexes**

* `journal_entries`: `date`, `sourceType`, `sourceId`
* `journal_lines`: `journalEntryId`, `accountId`, `createdAt`
* `invoices`: `customerId`, `jobId`, `status`, `date`
* `purchases`: `vendorId`, `date`
* `payments`: `invoiceId`, `vendorId`, `date`
* `stock_transactions`: `productId`, `referenceType`, `referenceId`, `date`
* `accounts`: `code`, `type`

---

# Page-by-page relation (mapped to diagram elements)

Below each page is described in the same vertical order as the image. For each: stores read (R), stores written (W), indexes used, transaction guidance, Electron responsibilities, offline/sync behavior and acceptance tests.

## 1) Accounts Home / Start (module entry)

**Purpose:** entry point to all accounting features; quick KPIs and navigation to voucher, invoices, GST, etc.

* **Reads:** `accounts`, `journal_entries` (recent), `ledger_views` (materialized summaries)
* **Writes:** none
* **Indexes:** `journal_entries.date`, `accounts.type`
* **Electron:** export summary to PDF/CSV via `backup.export` or `fs.writeAtomic`
* **Offline:** read-only; warn when there are pending high-priority offline ops affecting balances
* **Acceptance:** loads KPIs in <1s for up to 10k journal_lines

---

## 2) p-invoice (Purchase-invoice / Purchase flow page)

**Purpose:** create purchase invoices tied to vendors/suppliers and increase stock (GRN) + post AP

* **Reads:** `vendors`, `products`, `accounts` (inventory/AP mapping)
* **Writes (atomic):** `purchases.put()`, `purchase_items.bulkPut()`, `stock_transactions.bulkPut()`, `journal_entries.put()`, `journal_lines.bulkPut()`
* **Indexes:** `purchases.vendorId`, `purchase_items.purchaseId`, `stock_transactions.productId`
* **Txn:** MUST be atomic across `purchases`, `purchase_items`, `stock_transactions`, `journal_entries`, `journal_lines`
* **Electron:** attach supplier invoice PDFs via `fs.writeAtomic`, export purchases to `C:\malwa-crm\db\purchases.json`
* **Offline:** create local purchase + composite op in `offline_operations` (priority: high). On sync, update server-assigned numbers & versions.
* **Business rules:** posting must create Inventory debit + AP credit; update `products.currentStock` as part of tx
* **Acceptance:** posting purchase updates stock (sum of stock_transactions) and creates AP journal balanced entry

---

## 3) Voucher (Manual journal / Voucher entry)

**Purpose:** allow manual adjustments, contra entries, reclassifications

* **Reads:** `accounts` (to pick accounts), `journal_entries` for number generation
* **Writes (atomic):** `journal_entries.put()`, `journal_lines.bulkPut()`
* **Indexes:** `journal_entries.date`, `journal_lines.journalEntryId`
* **Txn:** YES. Validate `sum(debits) === sum(credits)` before commit
* **Electron:** optional export of voucher PDF
* **Offline:** create local journal + composite op; priority high
* **Acceptance:** unbalanced voucher blocked; balanced voucher saved and visible in ledger

---

## 4) Sell-Invoice (Sales Invoice accounting)

**Purpose:** map invoice posting to ledger (AR, Sales revenue, GST)

* **Reads:** `invoices`, `invoice_items`, `jobs`/`challans` if created from job
* **Writes (atomic):** `invoices.put()`, `invoice_items.bulkPut()`, `journal_entries.put()`, `journal_lines.bulkPut()`
* **Indexes:** `invoices.customerId`, `journal_entries.sourceType='invoice'`
* **Txn:** MUST be atomic to keep ledger consistent
* **Electron:** generate invoice PDF and save via `fs.writeAtomic`
* **Offline:** create invoice locally; composite op with priority high; when synced, update invoice number if server assigns
* **Acceptance:** posting sales invoice posts balanced journal entries; AR increases accordingly

---

## 5) P-challan (Purchase-challan) & Sell-challan

**Purpose:** challans used for inward/outward stock movements; linked to purchase or sale flows

* **Reads:** `purchases` / `invoices` context, `jobsheets` if from job
* **Writes (atomic):** `challans.put()`, `challan_items.bulkPut()`, and possibly `stock_transactions.bulkPut()` depending on flow
* **Indexes:** `challans.jobId`, `challans.vendorId`, `challan_items.challanId`
* **Txn:** YES when stock movement and journal entries involved
* **Electron:** export challan PDF
* **Offline:** create challan locally; stock tx created and queued if sync required
* **Acceptance:** challan creation generates stock_transactions and references to parent purchase/sell

---

## 6) GST-Ledger

**Purpose:** aggregate GST (input & output) for tax filing and reports

* **Reads:** `journal_lines` filtered by GST accountIds, `invoices`, `purchases`
* **Writes:** none (read-only) unless report caching implemented
* **Indexes:** `journal_lines.accountId`, `journal_entries.date`
* **Electron:** export GST report (CSV/PDF) via main process
* **Offline:** compute from local data; show warnings if offline ops pending that affect period totals
* **Acceptance:** GST totals equal sum of GST lines across invoices & purchases for the period

---

## 7) Cash Receipt (Payments applied / cash collection)

**Purpose:** receive payments and settle AR or AP; update bank/cash and invoices

* **Reads:** `invoices` for outstanding amounts, `accounts` (bank/cash)
* **Writes (atomic):** `payments.put()`, `journal_entries.put()`, `journal_lines.bulkPut()`, update `invoices.paidAmount` and possibly `invoices.status`
* **Indexes:** `payments.invoiceId`, `payments.customerId`, `journal_entries.sourceType`
* **Txn:** YES — payment creation & invoice update & journal entries must be atomic
* **Electron:** save receipt PDF via `fs.writeAtomic`
* **Offline:** allow local payment creation; composite op high priority
* **Acceptance:** payment reduces invoice balance and creates balanced bank/cash journal

---

## 8) Ledger / Account Detail pages

**Purpose:** view account-specific ledgers, trial balance, balances

* **Reads:** `journal_lines.query({accountId})` + bulkGet journal_entries to show narration & dates
* **Writes:** none typically; adjustments via vouchers
* **Indexes:** `journal_lines.accountId`, `journal_entries.date`
* **Electron:** export ledger CSV
* **Offline:** reflect local pending ops; show unsynced indicators
* **Acceptance:** ledger running balance matches `SUM(debits)-SUM(credits)` for account

---

# Cross-module / integration relations (exact to image)

* **Job/Invoice → Accounts:** When job-related invoice posts, it writes `invoice` + `journal_entries` (AR, Sales, GST). Accounts module reads these to show AR/Revenue.
* **Inventory → Accounts:** `stock_transactions` created during purchase or challan flows produce journal entries (Inventory, COGS) — Accounts module must listen to stock events or derive via journal_entries.
* **Vendor/Supplier → Accounts:** Purchases create AP ledger entries and link to vendors/suppliers.
* **Cash Receipt → Customer Ledger / Accounts:** Payments apply to invoices and update AR & Cash/Bank accounts.

All these relationships must use composite ops when they span multiple stores.

---

# Transaction patterns & examples (practical)

### A) Post Purchase Invoice (P-Invoice)

**Stores:** `purchases`, `purchase_items`, `stock_transactions`, `journal_entries`, `journal_lines`, `products`
**Steps:**

1. Begin tx across stores.
2. Insert purchase & items.
3. Insert stock_transactions(+qty), update `products.currentStock`.
4. Insert `journal_entry` and `journal_lines` (Inventory debit, AP credit).
5. Enqueue composite `offline_operations` in same tx (if sync required).
6. Commit.

### B) Post Sales Invoice

**Stores:** `invoices`, `invoice_items`, `journal_entries`, `journal_lines`
**Steps:**

1. Validate totals.
2. Begin tx.
3. Create invoice & items.
4. Create journal entry (AR debit), and lines (Sales credit, GST credit, etc.)
5. Enqueue composite op.
6. Commit.

### C) Receive Payment

**Stores:** `payments`, `journal_entries`, `journal_lines`, `invoices`
**Steps:**

1. Begin tx.
2. Create payment record.
3. Create journal entry (Bank/Cash debit, AR credit).
4. Update `invoice.paidAmount` and possibly `invoice.status`.
5. Enqueue composite op.
6. Commit.

---

# Electron IPC contract (Accounts-specific)

* `ipc.invoke('accounts.export', {stores:['journal_entries','journal_lines'], period:{from,to}})` → returns path of exported file
* `ipc.invoke('accounts.import', {sourcePath})` → import file and returns importReport with counts/errors
* `ipc.invoke('fs.writeAtomic', {path, buffer})` → write PDF/CSV for invoices, vouchers, GST reports
* `ipc.invoke('fs.readFileStream', {path})` → streaming read for bank CSV imports

Security: only allow paths inside configured root; validate file extensions and sizes.

---

# Sync & offline_operations (accounts-specific rules)

* Accounting ops MUST be **composite** and **idempotent**: include `opId` and server must dedupe by `opId`.
* Accounting ops should be **higher priority** in `offline_operations` queue to ensure timely reconciliation.
* On sync success, update local records with server `version` and canonical `id` values if server changes them.
* On conflict: create `conflicts` entry; route to admin/manual resolution (fields like amounts, accounts, tax rates should never auto-accept remote without admin confirmation).
* Retry policy: exponential backoff with jitter; max retries configurable (default 5).

---

# Business rules & validation (must implement)

* **Mandatory balancing:** All journal entries must have `sum(debits) === sum(credits)` prior to commit.
* **Fiscal period enforcement:** Prevent posting outside open fiscal period unless override by user with audit trail.
* **Non-deletable accounts:** DO NOT allow deletion of account with non-zero balance. Offer reassign/merge flows.
* **GST validation:** Tax calculations must meet configured tax rules; if mismatch, flag and block posting.

---

# Acceptance tests (Step 2: Accounts)

1. **Post P-invoice:** create purchase with 3 items → stock increases and AP created; verify `products.currentStock` and AP journal lines.
2. **Create Voucher:** balanced voucher saved; unbalanced voucher blocked.
3. **Post Sales Invoice:** invoice & balanced journal entries created; AR increased.
4. **Make Payment:** receive payment for invoice → `payments` created; invoice balance updated; journal balanced.
5. **GST report:** compute GST totals for a month and match sum of GST journal lines.
6. **Bank import:** import CSV → match payments; unmatched flagged for manual review.
7. **Offline sync:** post invoice offline → composite op created (priority high); after simulated success, local versions updated and op removed.
8. **Idempotency:** re-sending same opId is ignored by server and client handles 409/duplicate responses gracefully.

---

# Developer handoff checklist (copy-paste)

```
Accounts module implementation tasks:
1. Create stores & indexes for accounts, journal_entries, journal_lines, purchases, payments, stock_transactions
2. Implement db-adapter transaction helpers for atomic multi-store writes
3. Implement posting flows: p-invoice, sell-invoice, vouchers, payments with strict validation and atomic commits
4. Implement offline_operations composite op generation (include opId) within same tx as writes
5. Implement syncManager prioritization for accounting ops and idempotent retries
6. Implement Electron IPC handlers: accounts.export, accounts.import, fs.writeAtomic, fs.readFileStream
7. Add admin conflict resolution UI for accounting-level conflicts
8. Add unit & integration tests as per Acceptance tests
```

---

## Appendix — Sample composite op JSON (Accounts)

**Post Purchase composite op**

```json
{
  "opId":"op-purchase-20251115-001",
  "opType":"composite",
  "stores":["purchases","purchase_items","stock_transactions","journal_entries","journal_lines"],
  "payload":{ /* purchase, items, stock_tx, journal entry, lines */ },
  "priority":"high",
  "createdAt":"2025-11-15T10:00:00Z"
}
```

**Post Invoice composite op**

```json
{
  "opId":"op-invoice-20251115-001",
  "opType":"composite",
  "stores":["invoices","invoice_items","journal_entries","journal_lines"],
  "payload":{ /* invoice and ledger */ },
  "priority":"high"
}
```

---

If you want, I will now:

* generate `src/db/schema/accounts-schema.json` (machine-readable subset) and add to canvas, or
* produce `db-adapter` pseudo-implementation for Accounts flows (transaction helpers & examples), or
* scaffold Playwright/Electron test scripts for the Acceptance tests.

Which one should I add next?"

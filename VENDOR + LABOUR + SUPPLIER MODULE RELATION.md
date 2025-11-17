# VENDOR + LABOUR + SUPPLIER MODULE RELATION (UPDATED)

## Purpose
This document replaces the previous version and resolves the misunderstanding: **Supplier = goods/materials (paints, electrodes, steel, hardware, etc.)** and **Vendor = service providers/contractors (painting work, welding, mechanical work, installation, etc.)**. It is a precise, developer-ready spec mapping pages → IndexedDB stores → Electron duties → transaction rules → sync/offline behavior → QA acceptance tests and developer handoff instructions.

Use this as the canonical reference when implementing these modules or handing tasks to an AI/human developer.

_Last updated: 2025-11-15_

---

## Terminology (clear definitions)
- **Supplier (Materials Supplier)** — entities from whom you *purchase physical goods* (paints, electrodes, steel, hardware). Operations: Purchase invoices, goods received (GRN), purchase challans, stock in.
- **Vendor (Service Provider)** — entities who *provide services/work* (painting labor, welding work, mechanical services, installation). Operations: Service orders, vendor challans (if any), vendor invoices, vendor payments for services.
- **Labour (Technicians / Workers / Contractors)** — individuals or contractors who perform labor on jobs. Labour may be internal employees or external contractors (vendors). Labour records track hours, rates, jobsheets and labour cost posting.

Note: Suppliers and Vendors may overlap in real world (a supplier may sometimes provide installation), but for business logic we keep them distinct stores with clear responsibilities.

---

## Primary IndexedDB stores (per module)
- `suppliers` — supplier master (materials)
- `vendors` — vendor master (service providers)
- `labour` or `technicians` — worker profiles (may reference vendorId if contractor)
- `purchases`, `purchase_items` — purchase orders/invoices for materials
- `purchase_challans` / `p_challans` — goods received documentation (GRN)
- `jobsheets`, `jobsheet_items` — labour & items used on a job
- `vendor_orders` / `service_orders` — requests to vendor for service work (optional)
- `vendor_invoices` — invoices from vendors for services (alternatively use `purchases` with type)
- `payments` — payments to suppliers/vendors and labour settlements
- `stock_transactions` — stock ledger (material in/out)
- `products` — SKUs for materials
- `accounts`, `journal_entries`, `journal_lines` — accounting ledger
- `documents` — file paths for supplier invoices, vendor contracts, timesheets
- `offline_operations`, `conflicts`, `meta`

**Indexes (critical):**
- `suppliers`: `name`, `gstin`, `code`
- `vendors`: `name`, `serviceType`, `code`
- `labour`: `employeeId`, `technicianId`, `vendorId`
- `purchases`: `supplierId`, `date`
- `purchase_items`: `purchaseId`, `productId`
- `stock_transactions`: `productId`, `referenceType`, `referenceId`, `date`
- `jobsheets`: `jobId`, `technicianId`, `date`
- `vendor_invoices`: `vendorId`, `date`
- `payments`: `payeeId` (supplier/vendor/labour), `date`

---

# Module flows & page mapping (updated)
We present each module flow separately, then show cross-module integration points (Inventory & Accounts). Include read/write stores, transaction notes, Electron duties and acceptance tests.

---

## A) SUPPLIER MODULE (Materials purchases)
**Business:** buy physical goods (paints, electrodes, steel, hardware) → stock increases → AP & inventory accounting.

### Pages
1. Supplier List / Detail (`/suppliers/:id`) — master data, contact, payment terms
2. Purchase Create / P-Invoice (`/purchases/new`) — create purchase invoice or purchase order
3. Purchase Challan / GRN (`/purchases/:id/grn`) — record goods received (may be separate or same flow)
4. Supplier Ledger (`/suppliers/:id/ledger`) — view purchases, payments, outstanding AP

### Stores (R/W)
- Reads: `suppliers`, `products`, `accounts` (inventory/AP mapping), `purchases` for history
- Writes: `purchases`, `purchase_items`, `purchase_challans`, `stock_transactions`, `payments`, `journal_entries`, `journal_lines`

### Transactional rules (must be atomic)
**Purchase Posting (materials in):**
- Stores involved: `purchases`, `purchase_items`, `purchase_challans` (if GRN), `stock_transactions`, `journal_entries`, `journal_lines`, `offline_operations`.
- Steps: Begin transaction → put `purchase` & `items` → if GRN: create `purchase_challan` & `stock_transactions` (+qty) → create `journal_entries` (Inventory debit, AP credit) → enqueue `offline_operations` composite op → commit.
- Validation: `sum(items.amount) == purchase.total`; product SKUs exist; supplier GSTIN if tax required.

### Stock behaviour
- `stock_transactions` is the authority for stock movements; after purchases, compute `products.currentStock` by summing stock_transactions or update cached `currentStock` inside the tx.

### Electron duties
- Save supplier invoice PDFs via `fs.writeAtomic` and store path in `documents` or `purchase.documents[]`.
- Export supplier data (`backup.export`) to `C:\malwa-crm\db\suppliers\`.
- Import large price lists or supplier catalogs via `fs.readFileStream`.

### Offline / Sync
- Composite op required for purchase posting. Priority: high. Use idempotent `opId`.
- If server assigns invoice numbers, update local record on sync with server-provided number.

### Acceptance tests
1. Post purchase for 3 items → `stock_transactions` created (+qty) and `products.currentStock` increased.
2. Supplier ledger shows AP and payments reduce balance.
3. Export/import of supplier purchases round-trips correctly.

---

## B) VENDOR MODULE (Service providers / Contractors)
**Business:** hire external services (painting job, welding, mechanical jobs) → record service orders/invoices → pay vendors (AP or expense) → sometimes link to jobsheets.

### Pages
1. Vendor List / Detail (`/vendors/:id`) — vendor master, service types, rates
2. Service Order / Vendor Job (`/vendor_orders/new`) — create a job order for vendor work (optional)
3. Vendor Invoice (`/vendor_invoices/new`) — record vendor's billing for service
4. Vendor Ledger (`/vendors/:id/ledger`) — vendor outstanding & payments

### Stores (R/W)
- Reads: `vendors`, `jobs` (if vendor work attached to job), `accounts` (expense/AP mapping)
- Writes: `vendor_orders` (optional), `vendor_invoices` (or `purchases` with type='service'), `payments`, `journal_entries`, `journal_lines`

### Transactional rules
**Vendor Invoice Posting (service):**
- Stores: `vendor_invoices` (or `purchases`), `journal_entries`, `journal_lines`, `offline_operations`.
- Steps: Begin tx → create `vendor_invoice` with items or service lines → create `journal_entry` (Expense debit or Job Cost debit, AP credit) → enqueue composite op → commit.
- Validation: ensure service rates, vendor GST/TAX requirements.

**Vendor Work linked to Job:**
- If vendor performs work on a job, link vendor order to `jobId` or `jobsheet` and create `vendor_invoice` referencing job; ensure job cost updates accordingly.

### Electron duties
- Save vendor invoices and contracts as PDFs via `fs.writeAtomic`.

### Offline / Sync
- Vendor invoices should also be composite ops; priority high for accounting. Server may return canonical invoice numbers.

### Acceptance tests
1. Create vendor invoice for painting service → journal entry created (Labour/Service Expense debit, AP credit).
2. Link vendor invoice to a job → job cost reflects vendor charge.

---

## C) LABOUR MODULE (Technicians / Workers / Contractors)
**Business:** track labour hours & costs for jobs, create jobsheets, post labour cost to accounts, manage payroll/contractor payments if required.

### Pages
1. Labour / Technician List & Detail (`/labour/:id`) — profile, rate, bank info
2. Jobsheet creation (`/jobs/:id/jobsheet`) — record technician hours and items used
3. Labour Ledger (`/labour/:id/ledger`) — view labour cost & payments
4. Labour Payment / Settlement (`/labour/:id/pay`) — pay wages or contractor invoices

### Stores (R/W)
- Reads: `technicians`/`labour`, `jobsheets`, `jobsheet_items`, `accounts`
- Writes: `jobsheets`, `jobsheet_items`, `journal_entries` (labour cost), `payments`, `documents` (signed timesheets)

### Transactional rules
**Jobsheet Approval → Labour Cost posting:**
- Stores: `jobsheets`, `jobsheet_items`, `journal_entries`, `journal_lines`, `offline_operations`.
- Steps: Begin tx → set `jobsheet.status='approved'` → compute labour cost (hours * rate) → create `journal_entry` (Labour Expense debit, WIP/Job Cost credit or Payroll payable) → optionally create `payment` if immediate → enqueue composite op → commit.
- Validation: hours > 0, technician exists, rate set.

**Contractor Payment**
- If labour is external contractor (vendor), payments may be recorded as payments to `vendorId`; record `vendor_invoice` or `payments` and post corresponding journal.

### Electron duties
- Save signed timesheets (image/PDF) via `fs.writeAtomic` and record path in `documents`.

### Offline / Sync
- Jobsheet approval and labour cost posting should be composite ops. Labour payment ops are high priority.

### Acceptance tests
1. Create jobsheet for technician with 8 hours → approve jobsheet → labour journal entry created and job cost updated.
2. Pay technician/contractor → payment record created, payroll/journal balanced.

---

## D) Cross-module links & data flows (Inventory & Accounts integration)
**Supplier → Inventory**
- Purchase of materials from `suppliers` creates `stock_transactions` (type: purchase_in) and updates `products.currentStock` (or stock computed from transactions).

**Vendor/Labour → Jobs & Accounts**
- Vendor service invoices or labour contractor charges may be linked to `jobs` as job cost lines (increase job total cost). Posting vendor invoices creates AP and expense journal entries.
- Labour jobsheets post labour cost journal entries (Labour Expense / Job Cost). If paid immediately, create payment + journal.

**Payments & Ledger**
- Payments to suppliers/vendors/labour update respective ledgers. Use `payments.payeeId` with an additional `payeeType` (`supplier|vendor|labour`) to generalize store.

**Journal Entries**
- All financial events (purchase, vendor invoice, labour cost, payment) must create corresponding `journal_entries` and `journal_lines` to keep accounting consistent.

---

## E) Electron IPC & file duties (module-specific)
- `ipc.invoke('fs.writeAtomic', {path, buffer})` — for saving supplier invoices, vendor contracts, signed timesheets, PDF receipts
- `ipc.invoke('backup.export', {stores:['purchases','vendor_invoices','jobsheets'], filter:{supplierId/vendorId/jobId}})` — export subset
- `ipc.invoke('fs.readFileStream', {path})` — import supplier price lists, vendor catalogs, payroll CSVs
- **Security:** restrict save paths to configured app root and sanitize filenames

---

## F) Offline & sync rules (idempotency & priority)
- Use `offline_operations` composite ops for all cross-store operations: `purchase` + `stock_transactions` + `journal_entries`, `vendor_invoice` + `journal_entries`, `jobsheet_approve` + `journal_entries`.
- Assign priorities: **Accounting & Stock ops = high**; vendor and supplier ops above ordinary ops.
- Include `opId` for idempotency so server can dedupe.
- On sync conflict, create `conflicts` record and surface to admin for manual resolution (especially for amounts and tax rates).

---

## G) Validation & business rules (module specific)
- **Supplier purchase posting:** must validate supplier GSTIN (if tax), SKU exists, and amounts sum.
- **Vendor invoice posting:** expense mapping required; block if account mapping missing.
- **Jobsheet approval:** ensure technician exists and labour rate present.
- **Stock issues (from jobsheets/challans):** enforce stock availability rules (block or allow negative based on configuration) and log negative stock cases.
- **Payment validations:** cannot pay more than outstanding without confirmation; record payment references.

---

## H) Acceptance tests (condensed)
**Supplier tests**
1. Post purchase of 5 SKUs → `stock_transactions` created; `products.currentStock` increased.
2. Supplier ledger shows AP balance and payments reduce it.

**Vendor tests**
1. Create vendor invoice for service → journal (expense + AP) created.
2. Link vendor invoice to job → job cost updated.

**Labour tests**
1. Create jobsheet with hours → approve → labour cost journal created.
2. Pay contractor → payment record and journal created; ledger updated.

**Integration tests**
1. Purchase offline → composite op present; on simulated sync success, op removed and versions updated.
2. Post purchase then issue materials to job → `stock_transactions` reflect both IN & OUT and job cost contains material cost.
3. Duplicate op replay is rejected by server (idempotency) and client handles gracefully.

---

## I) Developer handoff (copy-paste)
```
Implement Supplier, Vendor, Labour modules with clear separation:
1. Create stores: suppliers, vendors, labour(technicians), purchases, purchase_challans, vendor_invoices, jobsheets, stock_transactions, payments
2. Add indexes listed above
3. Implement purchase posting: purchases + purchase_items + (optional) purchase_challan + stock_transactions + journal_entries in single tx; enqueue composite offline op
4. Implement vendor invoice posting: vendor_invoices + journal_entries in single tx
5. Implement jobsheet approve flow: jobsheet status update + labour journal entry in tx
6. Implement payment flow with atomic writes to payments + journal_entries + invoice/purchase paidAmount updates
7. Save attachments via Electron main with fs.writeAtomic and store paths
8. Add unit and integration tests per Acceptance tests; ensure idempotent opId handling on sync
```

---



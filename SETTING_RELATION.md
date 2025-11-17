# SETTING_RELATION.md

## Purpose

This document is the authoritative Settings module relation spec for Malwa CRM. It defines every Settings page, the IndexedDB stores each page reads/writes, Electron responsibilities, validation and transaction rules, sync/offline behavior, acceptance tests, and developer handoff instructions. Use this as the single source of truth when implementing Settings or handing the work to an AI/human developer.

*Last updated: 2025-11-15*

---

## Top-level Settings pages (recommended & mapped to your project)

1. Company Profile
2. Users
3. Roles & Permissions
4. Security
5. Backup & Restore
6. Database & Schema
7. Templates (Invoice / Estimate / Challan / Email)
8. Tax / GST & HSN
9. Inventory Settings
10. Numbering & Sequences (Auto-numbering)
11. Notifications & Integrations
12. Audit & Logs
13. App Preferences (locale, currency, timezone)

> Each page below maps to stores and flows used across the whole app.

---

# 1) Company Profile

**Purpose:** store global company info used by invoices, estimates, reports.

**Stores read:** `meta` (selectedLocalPath, schemaVersion), `accounts` (default tax or rounding accounts)
**Stores write:** `meta` (companyProfile object stored as `meta['companyProfile']`) or `settings.company`
**Indexes:** `meta.key`
**Electron duties:** save & load company logo image via `fs.writeAtomic`; on company change, trigger `backup.export` optional.
**Txn:** small write to `meta` — single store txn.
**Sync/offline:** company profile sync optional; mark `syncStatus` on meta if you push to server.
**Validation:** GSTIN format, required fields (name, address), logo size limits.
**Acceptance tests:** update company name/logo -> reflected in invoice PDF generation; logo file exists on disk.

---

# 2) Users (User Management)

**Purpose:** manage app users and their profiles.

**Stores read:** `users`, `roles`
**Stores write:** `users` (create/update/delete - soft delete), `meta` for user prefs
**Indexes:** `users.email`, `users.username`, `users.roleId`
**Txn:** user create + role assignment should be in a single txn if separate stores are changed
**Electron duties:** none special; secure storage of any uploaded avatars via `fs.writeAtomic`
**Security:** encrypted storage of any tokens; do not store plaintext passwords. Use server auth if available.
**Sync/offline:** user creation local-first; server authoritative for auth; mark newly created users with `syncStatus` and sync later
**Acceptance tests:** add user, assign role; user appears in list and role enforced on UI gating

---

# 3) Roles & Permissions

**Purpose:** define RBAC roles and granular permissions

**Stores read:** `roles`, `permissions` or `meta.roles` if embedded
**Stores write:** `roles` (create/update/delete)
**Indexes:** `roles.name`
**Txn:** when changing role assignments across many users, run transaction updating `roles` and affected `users.roleId` references
**Electron duties:** export/import role templates (JSON)
**Sync/offline:** roles changes local-first; on sync, server authoritative mapping may change
**Acceptance tests:** create role with permission X; user assigned that role cannot access feature Y if permission absent

---

# 4) Security

**Purpose:** app security policies (password rules, session timeout, 2FA flags)

**Stores read:** `meta.security` or `settings.security`
**Stores write:** `meta.security`
**Indexes:** `meta.key`
**Txn:** single store write
**Electron duties:** clear local session data, manage saved credentials securely (if implemented)
**Validation:** enforce password rules, validate 2FA configuration
**Acceptance tests:** change password policy → new user creation enforces rules

---

# 5) Backup & Restore

**Purpose:** manage local backups to `C:\malwa-crm\db` and restore flows

**Stores read:** all primary stores for export (`jobs`, `invoices`, `products`, `customers`, `journal_entries`, etc.)
**Stores write (on import):** all affected stores — `db.importAll` routine
**Indexes:** n/a (operation-level)
**Electron duties (critical):**

* `ipc.invoke('backup.export', {stores, filter, path})` → main writes atomic JSON files to `C:\malwa-crm\db\backups\<timestamp>\`
* `ipc.invoke('backup.import', {path})` → main streams files to renderer for batched import
* `ipc.invoke('fs.writeAtomic', {path,data})` for atomic writes (tmp -> rename)
  **Txn:** import must be done in batched transactions to avoid long-lived tx; each store in batches (e.g., 500 records/txn)
  **Offline/sync:** backups are local; do not sync backup files to server automatically
  **Validation:** checksum verification (e.g., sha256) of exported files
  **Acceptance tests:** export all stores -> backup folder exists with counts; import restores data and writes meta.lastBackup

---

# 6) Database & Schema (Migrations)

**Purpose:** manage `meta.schemaVersion`, run migrations

**Stores read:** `meta.schemaVersion`, `meta.migrationHistory`
**Stores write:** `meta.schemaVersion`, `meta.migrationHistory`, and store schema changes via migration scripts
**Indexes:** `meta.key`
**Electron duties:** write migration logs to `C:\malwa-crm\db\migrations\` and export pre-migration backup
**Txn:** each migration step should be idempotent and run in transactions covering affected stores. Always backup before migration.
**Validation:** migration sanity checks (stock sums, journal balancing) after migration
**Acceptance tests:** run `v1->v2` migration and verify `meta.schemaVersion` updated and sanity checks pass

---

# 7) Templates (Invoice/Estimate/Challan/Email)

**Purpose:** configure and manage printable templates

**Stores read:** `meta.templates` or `templates` store
**Stores write:** `templates.put()`
**Indexes:** `templates.name`
**Electron duties:** preview render (PDF generation) and save template files; store images (logos) via `fs.writeAtomic`
**Txn:** simple write to `templates` store
**Offline/sync:** templates local-first; may be synced to server if configured
**Acceptance tests:** change invoice template → PDF generation uses new template

---

# 8) Tax / GST & HSN

**Purpose:** GST rate config, default tax groups, HSN/SAC mapping

**Stores read:** `taxes`, `hsn_codes`, `accounts` (GST account mapping)
**Stores write:** `taxes.put()`, `hsn_codes.put()`, update `accounts` mapping
**Indexes:** `taxes.code`, `hsn_codes.hsn`
**Txn:** update tax table + account mapping in a single tx to avoid mismatch
**Electron duties:** export GST report (CSV) via `fs.writeAtomic`
**Validation:** tax rate ranges, HSN formats
**Acceptance tests:** set default GST rate -> invoice tax calculation uses it; GST report sums match journal lines

---

# 9) Inventory Settings

**Purpose:** configure UOM, reorder thresholds, stock behaviour

**Stores read:** `products`, `meta.inventorySettings`
**Stores write:** `meta.inventorySettings` and bulk update product UOMs if needed
**Indexes:** `products.sku`, `products.categoryId`
**Txn:** bulk changes to many products must be batched
**Electron duties:** export stock thresholds and low-stock report
**Offline/sync:** settings local; may affect business logic on client
**Acceptance tests:** set reorder level -> Inventory Dashboard flags low-stock products accordingly

---

# 10) Numbering & Sequences (Auto-numbering)

**Purpose:** configure auto-number patterns for invoices/challans/purchases

**Stores read:** `meta.sequences`, `invoices` (to compute next number if gaps exist)
**Stores write:** `meta.sequences` (nextNumber or lastUsed)
**Indexes:** `meta.key`
**Txn:** allocate next number inside transaction that also writes the record (e.g., invoice creation transaction must read & increment sequence in the same tx to avoid duplicates)
**Electron duties:** none specific
**Acceptance tests:** concurrent invoice creation should not produce duplicate invoice numbers

---

# 11) Notifications & Integrations

**Purpose:** configure email/SMS templates and 3rd-party integrations (e.g., SMTP, WhatsApp API)

**Stores read:** `meta.integrations`, `templates`
**Stores write:** `meta.integrations` and `templates`
**Electron duties:** sensitive credentials stored encrypted — main process may manage native OS keychain or local encryption
**Validation:** test connection checks (SMTP login) via IPC
**Acceptance tests:** SMTP test sends email using configured template

---

# 12) Audit & Logs

**Purpose:** maintain immutable logs for critical actions (invoice posting, payment, migration)

**Stores read:** `audit_logs` (write-only store) and `meta.logs` for retention policies
**Stores write:** `audit_logs.put()` on every critical action; also write to disk as `logs/<date>.log` via Electron main
**Indexes:** `audit_logs.createdAt`, `audit_logs.userId`, `audit_logs.actionType`
**Txn:** write audit log inside same txn as the action to ensure atomicity
**Electron duties:** rotate logs, prune older logs beyond retention using main process
**Acceptance tests:** posting invoice creates audit log entry with userId and timestamp and disk log entry

---

# 13) App Preferences (locale, currency, timezone)

**Purpose:** configure app-level preferences used throughout

**Stores read:** `meta.preferences`
**Stores write:** `meta.preferences`
**Indexes:** `meta.key`
**Txn:** single store writes
**Electron duties:** when timezone or locale changes, notify main for formatting and scheduling adjustments
**Acceptance tests:** change currency symbol -> invoice PDF uses new symbol

---

# Cross-cutting concerns & rules for Settings

1. **Atomicity:** Settings that affect runtime behavior (e.g., numbering) must be updated atomically with any record creation that depends on them (e.g., increment sequence + create invoice in single tx).
2. **Backups before migrations:** Always perform `backup.export` via Electron before any schema change.
3. **Audit trail:** All changes to critical settings (tax rates, numbering, roles) must create `audit_logs` entries.
4. **UI notification:** When Settings change affects open pages (template, numbering), show a prompt to reload or re-render affected UI.
5. **Permissions:** Only users with proper roles can change settings — enforce roles via `roles.permissions` and check in UI and server-side if present.

---

# Implementation patterns (pseudo-code examples)

## A) Allocate invoice number & create invoice in single tx

```
db.transaction(['meta','invoices','invoice_items','journal_entries','journal_lines','offline_operations'], 'readwrite', tx => {
  seq = tx.get('meta','sequences.invoice')
  invoiceNumber = format(seq.next)
  invoice.number = invoiceNumber
  tx.put('invoices', invoice)
  tx.bulkPut('invoice_items', items)
  tx.put('meta',{key:'sequences.invoice', value:{next:seq.next+1}})
  tx.put('journal_entries', je)
  tx.bulkPut('journal_lines', jeLines)
  tx.add('offline_operations', compositeOp)
})
```

## B) Backup export (Electron main invoked)

Renderer: `ipc.invoke('backup.export',{stores:['jobs','invoices','products']})`
Main: write to `C:\malwa-crm\db\backups\<timestamp>\` using writeAtomic for each file, return report.

## C) Update tax rate + account mapping (single tx)

```
db.transaction(['taxes','accounts','audit_logs'], 'readwrite', tx => {
  tx.put('taxes', newTax)
  tx.put('accounts', updatedAccount)
  tx.put('audit_logs', {action:'updateTax', userId, createdAt})
})
```

---

# Acceptance tests (Settings)

1. Change invoice template and generate PDF preview -> new template used
2. Update numbering scheme and create 10 invoices concurrently -> no duplicate numbers
3. Backup export & import roundtrip restores same store counts
4. Change GST rate -> invoice tax calc changes and GST report updated
5. Role change removes access to settings page for restricted user
6. Migration bump: run migration script -> meta.schemaVersion updated and sanity checks passed
7. Audit logs created for all critical settings changes

---

# Developer handoff (copy-paste)

```
Implement Settings module:
1. Create `meta` and `templates` small stores if not present
2. Implement UI pages as listed and map them to the corresponding stores
3. Implement Electron IPC in main: backup.export, backup.import, fs.writeAtomic, fs.readFileStream
4. Ensure every critical setting change writes `audit_logs` in same transaction
5. Implement sequence allocation helper to be called inside record-creation txs
6. Add unit & integration tests per Acceptance tests
```

---


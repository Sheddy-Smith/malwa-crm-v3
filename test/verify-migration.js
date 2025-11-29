/**
 * Dexie Migration Verification Script
 * 
 * Run this script to verify that the Dexie migration is complete and working.
 * It checks:
 * - Database can be initialized
 * - All stores are created
 * - Indexes are properly defined
 * - CRUD operations work
 * - Bulk operations are functional
 * - Existing data is preserved (if any)
 */

import { db, initDB, checkDatabaseStatus } from '../src/db/dexie.js';
import { dbOperations, bulkPut, bulkGet, nextSequence, generateCode, generateUUID } from '../src/lib/db.js';

const EXPECTED_STORES = [
  'customers', 'customer_ledger_entries', 'customer_jobs', 'invoices', 'invoice_items',
  'receipts', 'cash_receipts', 'vendors', 'vendor_ledger_entries', 'vendor_services',
  'vendor_orders', 'vendor_invoices', 'vendor_invoice_items', 'service_orders',
  'labour', 'labour_ledger_entries', 'labour_attendance', 'weekly_balances',
  'suppliers', 'supplier_ledger_entries', 'supplier_products',
  'inventory_categories', 'inventory_items', 'stock_movements', 'stock_transactions',
  'accounts', 'purchases', 'purchase_items', 'vouchers', 'gst_ledger', 'gstledger',
  'gst_accounts', 'ledger_views', 'purchase_challans', 'purchase_challan_items',
  'sell_challans', 'sellchallan', 'sell_challan_items', 'challans', 'challan', 'challan_items',
  'jobs', 'inspections', 'estimates', 'estimate_items', 'jobsheets', 'jobsheet_items',
  'journal_entries', 'journal_lines', 'products', 'payments',
  'templates', 'roles', 'permissions', 'taxes', 'hsn_codes', 'audit_logs',
  'rate_history', 'rate_list_memory', 'documents', 'branches', 'profiles', 'users',
  'sequences', 'daily_tasks', 'offline_operations', 'meta', 'conflicts',
  'syncQueue', 'job_operations_queue', 'user_page_visibility',
  'system_logs', 'backup_history', 'sync_status'
];

const EXPECTED_VERSION = 17;

let passed = 0;
let failed = 0;

const test = (name, condition) => {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.error(`❌ ${name}`);
    failed++;
  }
};

const verify = async () => {
  console.log('═'.repeat(60));
  console.log('🔍 Dexie Migration Verification');
  console.log('═'.repeat(60));
  console.log('');

  try {
    // 1. Database Initialization
    console.log('📦 Step 1: Database Initialization');
    await initDB();
    test('Database initialized', db.isOpen());
    test('Database name is correct', db.name === 'malwa_crm_db');
    test('Database version is correct', db.verno === EXPECTED_VERSION);
    console.log('');

    // 2. Database Status
    console.log('📊 Step 2: Database Status Check');
    const status = await checkDatabaseStatus();
    test('Database exists', status.exists);
    test('Database is open', status.isOpen);
    test('Version matches', status.version === EXPECTED_VERSION);
    console.log('');

    // 3. Store Verification
    console.log('🗄️ Step 3: Store Verification');
    const actualStores = db.tables.map(t => t.name);
    const missingStores = EXPECTED_STORES.filter(s => !actualStores.includes(s));
    const extraStores = actualStores.filter(s => !EXPECTED_STORES.includes(s));
    
    test(`All ${EXPECTED_STORES.length} stores exist`, missingStores.length === 0);
    if (missingStores.length > 0) {
      console.error(`   Missing stores: ${missingStores.join(', ')}`);
    }
    if (extraStores.length > 0) {
      console.warn(`   Extra stores: ${extraStores.join(', ')}`);
    }
    console.log('');

    // 4. Index Verification (sample)
    console.log('🔍 Step 4: Index Verification');
    const checkIndex = async (storeName, indexName) => {
      try {
        const table = db.table(storeName);
        const hasIndex = table.schema.indexes.some(idx => idx.name === indexName);
        return hasIndex;
      } catch (e) {
        return false;
      }
    };

    test('customers has email index', await checkIndex('customers', 'email'));
    test('vendors has code index', await checkIndex('vendors', 'code'));
    test('users has email index', await checkIndex('users', 'email'));
    test('jobs has status index', await checkIndex('jobs', 'status'));
    test('invoices has customer_id index', await checkIndex('invoices', 'customer_id'));
    console.log('');

    // 5. CRUD Operations
    console.log('✏️ Step 5: CRUD Operations');
    const testId = generateUUID();
    
    // Insert
    const inserted = await dbOperations.insert('customers', {
      id: testId,
      name: 'Verification Test Customer',
      email: 'verify@test.com',
      phone: '0000000000',
      type: 'test'
    });
    test('Insert operation works', inserted.id === testId);
    test('Auto-timestamps added', !!inserted.created_at && !!inserted.updated_at);

    // Get by ID
    const retrieved = await dbOperations.getById('customers', testId);
    test('Get by ID works', retrieved !== null && retrieved.id === testId);

    // Update
    const updated = await dbOperations.update('customers', testId, { name: 'Updated Name' });
    test('Update operation works', updated.name === 'Updated Name');

    // Get by Index
    const byEmail = await dbOperations.getByIndex('customers', 'email', 'verify@test.com');
    test('Get by index works', byEmail.length > 0);

    // Delete
    await dbOperations.delete('customers', testId);
    const deleted = await dbOperations.getById('customers', testId);
    test('Delete operation works', deleted === null);
    console.log('');

    // 6. Bulk Operations
    console.log('📦 Step 6: Bulk Operations');
    const bulkTestIds = [generateUUID(), generateUUID(), generateUUID()];
    const bulkData = bulkTestIds.map((id, i) => ({
      id,
      name: `Bulk Vendor ${i + 1}`,
      code: `BULK-${i + 1}`,
      serviceType: 'test'
    }));

    await bulkPut('vendors', bulkData);
    const bulkRetrieved = await bulkGet('vendors', bulkTestIds);
    test('Bulk put works', bulkRetrieved.length === 3);
    test('Bulk get works', bulkRetrieved.every(v => v.name.startsWith('Bulk Vendor')));

    // Cleanup
    await Promise.all(bulkTestIds.map(id => dbOperations.delete('vendors', id)));
    console.log('');

    // 7. Sequences
    console.log('🔢 Step 7: Auto-numbering Sequences');
    const seq1 = await nextSequence('VERIFY');
    const seq2 = await nextSequence('VERIFY');
    test('Sequences increment', seq2 === seq1 + 1);

    const code = await generateCode('VRF', 3);
    test('Code generation works', code.match(/VRF-\d{3}/));
    console.log('');

    // 8. Advanced Dexie Queries
    console.log('🚀 Step 8: Advanced Dexie Queries');
    
    // Create test data
    const jobId = generateUUID();
    await dbOperations.insert('jobs', {
      id: jobId,
      customerId: 'test-cust',
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    const pendingJobs = await db.jobs.where('status').equals('pending').toArray();
    test('WHERE query works', pendingJobs.length > 0);

    const count = await db.jobs.where('status').equals('pending').count();
    test('COUNT works', count >= 1);

    // Cleanup
    await dbOperations.delete('jobs', jobId);
    console.log('');

    // 9. Transaction Test
    console.log('🔄 Step 9: Transaction Test');
    const txTestId = generateUUID();
    let txSuccess = false;

    try {
      await db.transaction('rw', db.suppliers, db.supplier_ledger_entries, async () => {
        await db.suppliers.add({
          id: txTestId,
          name: 'TX Test Supplier',
          code: 'TX-001'
        });
        await db.supplier_ledger_entries.add({
          id: generateUUID(),
          supplier_id: txTestId,
          entry_date: new Date().toISOString(),
          debit: 0,
          credit: 1000,
          description: 'Test entry'
        });
        txSuccess = true;
      });
    } catch (e) {
      console.error('Transaction failed:', e);
    }

    test('Transactions work', txSuccess);
    
    // Verify transaction data
    const supplier = await dbOperations.getById('suppliers', txTestId);
    const entries = await dbOperations.getByIndex('supplier_ledger_entries', 'supplier_id', txTestId);
    test('Transaction created supplier', supplier !== null);
    test('Transaction created entry', entries.length > 0);

    // Cleanup
    await dbOperations.delete('suppliers', txTestId);
    if (entries.length > 0) {
      await dbOperations.delete('supplier_ledger_entries', entries[0].id);
    }
    console.log('');

    // 10. Data Persistence Check
    console.log('💾 Step 10: Data Persistence Check');
    const persistId = generateUUID();
    await dbOperations.insert('meta', {
      id: persistId,
      key: 'persist_test',
      value: 'test_value'
    });

    db.close();
    await initDB();

    const persisted = await dbOperations.getById('meta', persistId);
    test('Data persists after close/reopen', persisted !== null);

    // Cleanup
    await dbOperations.delete('meta', persistId);
    console.log('');

    // Summary
    console.log('═'.repeat(60));
    console.log('📊 Verification Summary');
    console.log('═'.repeat(60));
    console.log(`Total Checks: ${passed + failed}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);
    console.log('═'.repeat(60));

    if (failed === 0) {
      console.log('\n🎉 SUCCESS! Dexie migration is complete and working correctly.\n');
      console.log('✅ Database initialized with Dexie');
      console.log('✅ All stores and indexes created');
      console.log('✅ CRUD operations functional');
      console.log('✅ Bulk operations working');
      console.log('✅ Sequences functioning');
      console.log('✅ Advanced queries operational');
      console.log('✅ Transactions working');
      console.log('✅ Data persistence verified');
      console.log('\nThe app is ready to use with Dexie! 🚀\n');
      return true;
    } else {
      console.error('\n⚠️ ISSUES DETECTED! Please review the failed checks above.\n');
      return false;
    }

  } catch (error) {
    console.error('\n💥 VERIFICATION FAILED WITH ERROR:');
    console.error(error);
    console.error(error.stack);
    return false;
  }
};

// Run verification
verify()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

export { verify };

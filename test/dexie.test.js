/**
 * Dexie Database Tests
 * 
 * Lightweight tests for the Dexie implementation
 * - Database creation and schema validation
 * - CRUD operations (Create, Read, Update, Delete)
 * - Index queries and bulk operations
 * - Migration and data persistence
 */

import { db, initDB, checkDatabaseStatus, clearDatabase, generateUUID } from '../db/dexie.js';
import { dbOperations, bulkPut, bulkGet, nextSequence, generateCode } from '../lib/db.js';

// Test utilities
const testResults = [];
let totalTests = 0;
let passedTests = 0;

const assert = (condition, message) => {
  totalTests++;
  if (condition) {
    passedTests++;
    testResults.push({ status: '✅', message });
    console.log(`✅ ${message}`);
  } else {
    testResults.push({ status: '❌', message });
    console.error(`❌ ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
};

const assertEqual = (actual, expected, message) => {
  assert(actual === expected, `${message} (expected: ${expected}, got: ${actual})`);
};

const assertNotNull = (value, message) => {
  assert(value !== null && value !== undefined, message);
};

// Test suite
const runTests = async () => {
  console.log('🧪 Starting Dexie Database Tests...\n');
  
  try {
    // Test 1: Database Initialization
    console.log('📦 Test 1: Database Initialization');
    await initDB();
    assert(db.isOpen(), 'Database should be open after initialization');
    assertEqual(db.name, 'malwa_crm_db', 'Database name should be malwa_crm_db');
    assertEqual(db.verno, 17, 'Database version should be 17');
    console.log('');

    // Test 2: Database Status Check
    console.log('📊 Test 2: Database Status Check');
    const status = await checkDatabaseStatus();
    assert(status.exists, 'Database should exist');
    assertEqual(status.version, 17, 'Status should report version 17');
    assert(status.stores.length > 0, 'Database should have stores');
    assert(status.stores.includes('customers'), 'Database should have customers store');
    assert(status.stores.includes('vendors'), 'Database should have vendors store');
    console.log('');

    // Test 3: Store Validation
    console.log('🗄️ Test 3: Store Validation');
    const expectedStores = [
      'customers', 'vendors', 'suppliers', 'labour', 'inventory_items',
      'jobs', 'invoices', 'payments', 'sequences', 'users', 'meta'
    ];
    expectedStores.forEach(storeName => {
      const table = db.table(storeName);
      assert(table !== null, `Store ${storeName} should exist`);
    });
    console.log('');

    // Test 4: Insert Operation
    console.log('➕ Test 4: Insert Operation');
    const testCustomer = {
      id: generateUUID(),
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '1234567890',
      type: 'individual'
    };
    const insertedCustomer = await dbOperations.insert('customers', testCustomer);
    assertNotNull(insertedCustomer, 'Inserted customer should not be null');
    assertEqual(insertedCustomer.name, testCustomer.name, 'Customer name should match');
    assertNotNull(insertedCustomer.created_at, 'Customer should have created_at timestamp');
    assertNotNull(insertedCustomer.updated_at, 'Customer should have updated_at timestamp');
    console.log('');

    // Test 5: Get by ID
    console.log('🔍 Test 5: Get by ID');
    const retrievedCustomer = await dbOperations.getById('customers', testCustomer.id);
    assertNotNull(retrievedCustomer, 'Retrieved customer should not be null');
    assertEqual(retrievedCustomer.id, testCustomer.id, 'Customer ID should match');
    assertEqual(retrievedCustomer.name, testCustomer.name, 'Customer name should match');
    console.log('');

    // Test 6: Update Operation
    console.log('✏️ Test 6: Update Operation');
    const updatedCustomer = await dbOperations.update('customers', testCustomer.id, {
      name: 'Updated Test Customer',
      phone: '9876543210'
    });
    assertEqual(updatedCustomer.name, 'Updated Test Customer', 'Customer name should be updated');
    assertEqual(updatedCustomer.phone, '9876543210', 'Customer phone should be updated');
    assertEqual(updatedCustomer.email, testCustomer.email, 'Customer email should remain unchanged');
    console.log('');

    // Test 7: Get All
    console.log('📋 Test 7: Get All Operation');
    const allCustomers = await dbOperations.getAll('customers');
    assert(Array.isArray(allCustomers), 'getAll should return an array');
    assert(allCustomers.length >= 1, 'Should have at least one customer');
    const found = allCustomers.find(c => c.id === testCustomer.id);
    assertNotNull(found, 'Should find our test customer in getAll results');
    console.log('');

    // Test 8: Index Query
    console.log('🔎 Test 8: Index Query');
    const customersByEmail = await dbOperations.getByIndex('customers', 'email', testCustomer.email);
    assert(Array.isArray(customersByEmail), 'getByIndex should return an array');
    assert(customersByEmail.length >= 1, 'Should find customer by email index');
    assertEqual(customersByEmail[0].email, testCustomer.email, 'Email should match');
    console.log('');

    // Test 9: Query with Filters
    console.log('🎯 Test 9: Query with Filters');
    const filteredCustomers = await dbOperations.query('customers', { type: 'individual' });
    assert(Array.isArray(filteredCustomers), 'query should return an array');
    assert(filteredCustomers.every(c => c.type === 'individual'), 'All results should match filter');
    console.log('');

    // Test 10: Bulk Operations
    console.log('📦 Test 10: Bulk Operations');
    const testVendors = [
      { id: generateUUID(), name: 'Vendor 1', code: 'V-001', serviceType: 'mechanic' },
      { id: generateUUID(), name: 'Vendor 2', code: 'V-002', serviceType: 'painter' },
      { id: generateUUID(), name: 'Vendor 3', code: 'V-003', serviceType: 'electrician' }
    ];
    const bulkResult = await bulkPut('vendors', testVendors);
    assertEqual(bulkResult.length, 3, 'Should bulk insert 3 vendors');
    
    const vendorIds = testVendors.map(v => v.id);
    const bulkGetResult = await bulkGet('vendors', vendorIds);
    assertEqual(bulkGetResult.length, 3, 'Should bulk get 3 vendors');
    assert(bulkGetResult.every(v => v.name.startsWith('Vendor')), 'All vendors should be retrieved');
    console.log('');

    // Test 11: Count Operation
    console.log('🔢 Test 11: Count Operation');
    const vendorCount = await dbOperations.count('vendors');
    assert(vendorCount >= 3, 'Should have at least 3 vendors');
    console.log('');

    // Test 12: Auto-numbering Sequences
    console.log('🔢 Test 12: Auto-numbering Sequences');
    const seq1 = await nextSequence('TEST');
    const seq2 = await nextSequence('TEST');
    const seq3 = await nextSequence('TEST');
    assertEqual(seq2, seq1 + 1, 'Sequences should increment');
    assertEqual(seq3, seq2 + 1, 'Sequences should increment continuously');
    
    const code1 = await generateCode('TST', 4);
    assert(code1.startsWith('TST-'), 'Generated code should have prefix');
    assert(code1.match(/TST-\d{4}/), 'Generated code should match pattern');
    console.log('');

    // Test 13: Delete Operation
    console.log('🗑️ Test 13: Delete Operation');
    const deleteResult = await dbOperations.delete('customers', testCustomer.id);
    assertEqual(deleteResult, true, 'Delete should return true');
    
    const deletedCustomer = await dbOperations.getById('customers', testCustomer.id);
    assert(deletedCustomer === null, 'Deleted customer should not be found');
    console.log('');

    // Test 14: Dexie Advanced Queries
    console.log('🚀 Test 14: Dexie Advanced Queries');
    // Create test data for advanced queries
    const testJobs = [
      { id: generateUUID(), customerId: 'cust-1', status: 'pending', createdAt: '2024-01-01' },
      { id: generateUUID(), customerId: 'cust-1', status: 'in-progress', createdAt: '2024-01-02' },
      { id: generateUUID(), customerId: 'cust-2', status: 'completed', createdAt: '2024-01-03' }
    ];
    await bulkPut('jobs', testJobs);
    
    // Query using Dexie's where clause
    const pendingJobs = await db.jobs.where('status').equals('pending').toArray();
    assert(pendingJobs.length >= 1, 'Should find pending jobs');
    
    const custJobs = await db.jobs.where('customerId').equals('cust-1').toArray();
    assert(custJobs.length >= 2, 'Should find jobs for customer 1');
    console.log('');

    // Test 15: Transaction Test
    console.log('🔄 Test 15: Transaction Test');
    const testSupplier = {
      id: generateUUID(),
      name: 'Test Supplier',
      code: 'SUP-001',
      opening_balance: 1000
    };
    
    await db.transaction('rw', db.suppliers, db.supplier_ledger_entries, async () => {
      await db.suppliers.add(testSupplier);
      await db.supplier_ledger_entries.add({
        id: generateUUID(),
        supplier_id: testSupplier.id,
        entry_date: new Date().toISOString(),
        debit: 500,
        credit: 0,
        description: 'Test entry'
      });
    });
    
    const supplier = await dbOperations.getById('suppliers', testSupplier.id);
    assertNotNull(supplier, 'Supplier should be created in transaction');
    
    const entries = await dbOperations.getByIndex('supplier_ledger_entries', 'supplier_id', testSupplier.id);
    assertEqual(entries.length, 1, 'Should have one ledger entry');
    console.log('');

    // Test 16: Data Persistence Check
    console.log('💾 Test 16: Data Persistence Check');
    const beforeCloseVendors = await dbOperations.getAll('vendors');
    const beforeCloseCount = beforeCloseVendors.length;
    
    // Close and reopen
    db.close();
    await initDB();
    
    const afterOpenVendors = await dbOperations.getAll('vendors');
    assertEqual(afterOpenVendors.length, beforeCloseCount, 'Data should persist after close/reopen');
    console.log('');

    // Test 17: Cleanup test data
    console.log('🧹 Test 17: Cleanup Test Data');
    await dbOperations.clear('vendors');
    await dbOperations.clear('jobs');
    await dbOperations.clear('suppliers');
    await dbOperations.clear('supplier_ledger_entries');
    const clearedVendors = await dbOperations.count('vendors');
    assertEqual(clearedVendors, 0, 'Vendors should be cleared');
    console.log('');

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Summary');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
    console.log('='.repeat(50));

    if (passedTests === totalTests) {
      console.log('\n✅ All tests passed! Dexie implementation is working correctly.');
      return true;
    } else {
      console.error('\n❌ Some tests failed. Please review the implementation.');
      return false;
    }

  } catch (error) {
    console.error('\n💥 Test suite failed with error:', error);
    console.error(error.stack);
    return false;
  }
};

// Export test runner
export { runTests };

// Auto-run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

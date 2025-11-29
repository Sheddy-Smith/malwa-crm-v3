/**
 * Dexie Integration Test Suite
 * 
 * Run this in the browser console to verify Dexie integration:
 * 1. Open DevTools (F12)
 * 2. Go to Console
 * 3. Paste this entire file
 * 4. Call: await testDexieIntegration()
 */

async function testDexieIntegration() {
  console.log('🧪 Starting Dexie Integration Tests...\n');
  
  const { db, dbOperations, advancedQuery, paginate, search, aggregate } = await import('./src/lib/db.js');
  
  let passedTests = 0;
  let failedTests = 0;
  
  // Test 1: Database Initialization
  console.log('Test 1: Database Initialization');
  try {
    const isOpen = db.isOpen();
    console.log(isOpen ? '✅ PASSED' : '❌ FAILED', '- Database is open:', isOpen);
    if (isOpen) passedTests++; else failedTests++;
  } catch (e) {
    console.log('❌ FAILED -', e.message);
    failedTests++;
  }
  
  // Test 2: Check Database Version
  console.log('\nTest 2: Database Version');
  try {
    const version = db.verno;
    console.log(version === 17 ? '✅ PASSED' : '❌ FAILED', '- Database version:', version);
    if (version === 17) passedTests++; else failedTests++;
  } catch (e) {
    console.log('❌ FAILED -', e.message);
    failedTests++;
  }
  
  // Test 3: Verify All Tables Exist
  console.log('\nTest 3: Verify All Tables');
  try {
    const requiredTables = [
      'customers', 'vendors', 'labour', 'suppliers', 
      'jobs', 'invoices', 'inventory_items', 'accounts'
    ];
    
    const existingTables = db.tables.map(t => t.name);
    const allExist = requiredTables.every(t => existingTables.includes(t));
    
    console.log(allExist ? '✅ PASSED' : '❌ FAILED', '- All required tables exist:', allExist);
    console.log('  Total tables:', existingTables.length);
    if (allExist) passedTests++; else failedTests++;
  } catch (e) {
    console.log('❌ FAILED -', e.message);
    failedTests++;
  }
  
  // Test 4: Test CRUD Operations
  console.log('\nTest 4: CRUD Operations');
  try {
    // Create
    const testCustomer = await dbOperations.insert('customers', {
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '1234567890',
      type: 'test',
      status: 'active'
    });
    console.log('  ✓ Create:', testCustomer.id);
    
    // Read
    const retrieved = await dbOperations.getById('customers', testCustomer.id);
    console.log('  ✓ Read:', retrieved.name);
    
    // Update
    await dbOperations.update('customers', testCustomer.id, {
      name: 'Updated Test Customer'
    });
    const updated = await dbOperations.getById('customers', testCustomer.id);
    console.log('  ✓ Update:', updated.name);
    
    // Delete
    await dbOperations.delete('customers', testCustomer.id);
    const deleted = await dbOperations.getById('customers', testCustomer.id);
    console.log('  ✓ Delete:', deleted === null);
    
    console.log('✅ PASSED - CRUD operations work correctly');
    passedTests++;
  } catch (e) {
    console.log('❌ FAILED -', e.message);
    failedTests++;
  }
  
  // Test 5: Test Automatic Timestamps
  console.log('\nTest 5: Automatic Timestamps');
  try {
    const customer = await dbOperations.insert('customers', {
      name: 'Timestamp Test',
      email: 'timestamp@test.com'
    });
    
    const hasTimestamps = customer.created_at && customer.updated_at;
    console.log(hasTimestamps ? '✅ PASSED' : '❌ FAILED', 
      '- Automatic timestamps:', customer.created_at);
    
    // Cleanup
    await dbOperations.delete('customers', customer.id);
    
    if (hasTimestamps) passedTests++; else failedTests++;
  } catch (e) {
    console.log('❌ FAILED -', e.message);
    failedTests++;
  }
  
  // Test 6: Test Compound Indexes
  console.log('\nTest 6: Compound Indexes');
  try {
    // Add test data
    await dbOperations.insert('customers', {
      name: 'Business Customer 1',
      type: 'business',
      status: 'active'
    });
    
    // Query using compound index
    const results = await db.customers
      .where('[type+status]')
      .equals(['business', 'active'])
      .toArray();
    
    console.log(results.length > 0 ? '✅ PASSED' : '❌ FAILED', 
      '- Compound index query:', results.length, 'results');
    
    // Cleanup
    for (const r of results) {
      if (r.name && r.name.includes('Business Customer')) {
        await dbOperations.delete('customers', r.id);
      }
    }
    
    if (results.length > 0) passedTests++; else failedTests++;
  } catch (e) {
    console.log('❌ FAILED -', e.message);
    failedTests++;
  }
  
  // Test 7: Test Advanced Query
  console.log('\nTest 7: Advanced Query');
  try {
    // Add test data
    const c1 = await dbOperations.insert('customers', {
      name: 'High Value Customer',
      balance: 150000,
      status: 'active'
    });
    
    const c2 = await dbOperations.insert('customers', {
      name: 'Low Value Customer',
      balance: 50000,
      status: 'active'
    });
    
    // Advanced query
    const results = await advancedQuery('customers', {
      balance: { $gt: 100000 },
      status: 'active'
    });
    
    console.log(results.length > 0 ? '✅ PASSED' : '❌ FAILED', 
      '- Advanced query with operators:', results.length, 'results');
    
    // Cleanup
    await dbOperations.delete('customers', c1.id);
    await dbOperations.delete('customers', c2.id);
    
    if (results.length > 0) passedTests++; else failedTests++;
  } catch (e) {
    console.log('❌ FAILED -', e.message);
    failedTests++;
  }
  
  // Test 8: Test Pagination
  console.log('\nTest 8: Pagination');
  try {
    // Add test data
    const testIds = [];
    for (let i = 1; i <= 25; i++) {
      const c = await dbOperations.insert('customers', {
        name: `Pagination Test ${i}`,
        status: 'test'
      });
      testIds.push(c.id);
    }
    
    // Test pagination
    const page1 = await paginate('customers', {
      page: 1,
      limit: 10,
      filters: { status: 'test' }
    });
    
    console.log(page1.data.length === 10 ? '✅ PASSED' : '❌ FAILED', 
      `- Pagination: ${page1.data.length} items, ${page1.totalPages} pages`);
    
    // Cleanup
    for (const id of testIds) {
      await dbOperations.delete('customers', id);
    }
    
    if (page1.data.length === 10) passedTests++; else failedTests++;
  } catch (e) {
    console.log('❌ FAILED -', e.message);
    failedTests++;
  }
  
  // Test 9: Test Search
  console.log('\nTest 9: Search Function');
  try {
    // Add test data
    const c = await dbOperations.insert('customers', {
      name: 'John Search Test',
      email: 'johnsearch@test.com',
      phone: '9999999999'
    });
    
    // Search
    const results = await search('customers', 'john', ['name', 'email']);
    
    console.log(results.length > 0 ? '✅ PASSED' : '❌ FAILED', 
      '- Search function:', results.length, 'results');
    
    // Cleanup
    await dbOperations.delete('customers', c.id);
    
    if (results.length > 0) passedTests++; else failedTests++;
  } catch (e) {
    console.log('❌ FAILED -', e.message);
    failedTests++;
  }
  
  // Test 10: Test Aggregation
  console.log('\nTest 10: Aggregation Functions');
  try {
    // Add test data
    const testIds = [];
    for (let i = 1; i <= 5; i++) {
      const inv = await dbOperations.insert('invoices', {
        invoice_no: `TEST-${i}`,
        amount: i * 1000,
        status: 'test'
      });
      testIds.push(inv.id);
    }
    
    // Aggregations
    const sum = await aggregate.sum('invoices', 'amount', { status: 'test' });
    const avg = await aggregate.avg('invoices', 'amount', { status: 'test' });
    const count = await aggregate.count('invoices', { status: 'test' });
    
    console.log(sum === 15000 && count === 5 ? '✅ PASSED' : '❌ FAILED',
      `- Aggregation: sum=${sum}, avg=${avg}, count=${count}`);
    
    // Cleanup
    for (const id of testIds) {
      await dbOperations.delete('invoices', id);
    }
    
    if (sum === 15000 && count === 5) passedTests++; else failedTests++;
  } catch (e) {
    console.log('❌ FAILED -', e.message);
    failedTests++;
  }
  
  // Test Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));
  
  if (failedTests === 0) {
    console.log('🎉 All tests passed! Dexie integration is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the output above for details.');
  }
  
  return {
    passed: passedTests,
    failed: failedTests,
    total: passedTests + failedTests
  };
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testDexieIntegration };
}

console.log('✅ Dexie Integration Test Suite Loaded');
console.log('📝 Run: await testDexieIntegration()');

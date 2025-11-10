import { dbOperations } from '@/lib/db';

export const debugDatabase = async () => {
  console.log('=== Database Debug Info ===');

  try {
    const users = await dbOperations.getAll('users');
    console.log('Users in database:', users.length);
    users.forEach(user => {
      console.log('- User:', { id: user.id, email: user.email });
    });

    const profiles = await dbOperations.getAll('profiles');
    console.log('Profiles in database:', profiles.length);
    profiles.forEach(profile => {
      console.log('- Profile:', { id: profile.id, name: profile.name, email: profile.email, role: profile.role });
    });
  } catch (error) {
    console.error('Error debugging database:', error);
  }

  console.log('=== End Debug Info ===');
};

export const clearAllData = async () => {
  const tables = [
    'users', 'profiles', 'customers', 'customer_ledger_entries', 'customer_jobs',
    'invoices', 'receipts', 'vendors', 'vendor_ledger_entries', 'labour',
    'labour_ledger_entries', 'suppliers', 'supplier_ledger_entries',
    'inventory_categories', 'inventory_items', 'stock_movements',
    'vouchers', 'gst_ledger', 'purchase_challans', 'sell_challans', 'branches'
  ];

  for (const table of tables) {
    try {
      await dbOperations.clear(table);
      console.log(`Cleared ${table}`);
    } catch (error) {
      console.error(`Error clearing ${table}:`, error);
    }
  }

  console.log('All data cleared. Refresh the page to reinitialize.');
};

// Attach to window immediately
window.debugDB = debugDatabase;
window.clearDB = clearAllData;

console.log('Debug utilities loaded: window.debugDB() and window.clearDB()');

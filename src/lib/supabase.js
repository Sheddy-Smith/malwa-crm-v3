/**
 * Temporary stub for Supabase client.
 * This file exists only to prevent build errors while migrating job module pages to IndexedDB.
 * All methods return empty results or throw errors to encourage migration.
 */

const supabase = {
  from: (table) => ({
    select: () => ({
      eq: () => ({ data: [], error: new Error(`${table} - Supabase is disabled. Use IndexedDB.`) }),
      order: () => ({
        eq: () => ({ data: [], error: new Error(`${table} - Supabase is disabled. Use IndexedDB.`) }),
      }),
    }),
    insert: () => ({ data: null, error: new Error(`${table} - Supabase is disabled. Use IndexedDB.`) }),
    update: () => ({
      eq: () => ({ data: null, error: new Error(`${table} - Supabase is disabled. Use IndexedDB.`) }),
    }),
    delete: () => ({
      eq: () => ({ data: null, error: new Error(`${table} - Supabase is disabled. Use IndexedDB.`) }),
    }),
  }),
};

export default supabase;

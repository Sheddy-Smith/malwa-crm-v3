// Initialize Supabase client when environment variables are present.
// If VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing, expose a safe stub
// that returns empty results so components referencing `supabase` don't crash during development.

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

function makeStubResult(result = { data: [], error: null }) {
  const builder = {
    select: async () => result,
    insert: async () => result,
    update: async () => result,
    delete: async () => result,
    order: () => builder,
    eq: () => builder,
    single: async () => result,
    returning: () => builder,
    limit: () => builder,
  };
  return builder;
}

let supabase;

if (url && key) {
  try {
    supabase = createClient(url, key);
  } catch (e) {
    // fallback to stub if client creation fails
    console.error('Failed to create Supabase client, falling back to stub:', e);
    supabase = {
      from: () => makeStubResult(),
      rpc: async () => ({ data: null, error: null }),
      auth: { user: () => null, signIn: async () => ({ user: null, error: null }), signOut: async () => ({ error: null }) }
    };
  }
} else {
  supabase = {
    from: () => makeStubResult(),
    rpc: async () => ({ data: null, error: null }),
    auth: { user: () => null, signIn: async () => ({ user: null, error: null }), signOut: async () => ({ error: null }) }
  };
}

if (typeof window !== 'undefined') {
  // expose for legacy code that expects a global `supabase`
  window.supabase = supabase;
}

export default supabase;

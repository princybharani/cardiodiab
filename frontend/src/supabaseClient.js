import { createClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'cardiodiab_supabase_url';
const STORAGE_ANON_KEY = 'cardiodiab_supabase_anon_key';
const STORAGE_DEMO_USER_KEY = 'cardiodiab_demo_user';

let supabaseInstance = null;

export function getStoredSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const storedUrl = localStorage.getItem(STORAGE_URL_KEY);
  const storedKey = localStorage.getItem(STORAGE_ANON_KEY);

  const url = storedUrl || envUrl || '';
  const key = storedKey || envKey || '';

  return { url, key, isConfigured: Boolean(url && key && url.includes('supabase.co')) };
}

export function initSupabase() {
  const { url, key, isConfigured } = getStoredSupabaseConfig();
  if (isConfigured) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return supabaseInstance;
    } catch (e) {
      console.warn('[Supabase] Init error:', e);
      supabaseInstance = null;
    }
  }
  supabaseInstance = null;
  return null;
}

// Initialize on file load
initSupabase();

export function getSupabase() {
  if (!supabaseInstance) {
    initSupabase();
  }
  return supabaseInstance;
}

export async function testSupabaseConnection(url, key) {
  if (!url || !key) {
    return { success: false, message: 'Both Supabase URL and Anon Key are required.' };
  }
  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    return { success: false, message: 'Invalid URL. It should look like: https://your-project.supabase.co' };
  }
  try {
    const testClient = createClient(url, key);
    // Ping patient_reports or auth health
    const { data, error } = await testClient.from('patient_reports').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, we still know auth connected if error is 42P01 (relation does not exist)
      if (error.message && error.message.includes('relation "patient_reports" does not exist')) {
        return { 
          success: true, 
          message: 'Connected to Supabase! (Note: run supabase/schema.sql in Supabase SQL Editor to create tables)' 
        };
      }
      return { success: false, message: error.message || 'Failed to query Supabase' };
    }
    return { success: true, message: 'Successfully verified Supabase database connection!' };
  } catch (err) {
    return { success: false, message: err.message || 'Connection test failed' };
  }
}

export async function saveSupabaseConfig(url, key) {
  localStorage.setItem(STORAGE_URL_KEY, url.trim());
  localStorage.setItem(STORAGE_ANON_KEY, key.trim());
  initSupabase();

  // Also sync to FastAPI backend
  try {
    await fetch('http://127.0.0.1:8000/api/config/supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supabase_url: url.trim(), supabase_key: key.trim() }),
    });
  } catch (e) {
    console.warn('[Supabase] Failed to sync config to backend:', e);
  }
}

export async function clearSupabaseConfig() {
  localStorage.removeItem(STORAGE_URL_KEY);
  localStorage.removeItem(STORAGE_ANON_KEY);
  supabaseInstance = null;
}

// -------------------------------------------------------------
// Authentication Operations (Supabase Auth + Instant Local Fallback)
// -------------------------------------------------------------

export async function getCurrentUser() {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data: { user }, error } = await sb.auth.getUser();
      if (user && !error) {
        return {
          id: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Patient',
          provider: 'supabase',
        };
      }
    } catch (e) {
      console.warn('[Supabase] getUser error:', e);
    }
  }

  // Fallback demo user from localStorage
  const demoRaw = localStorage.getItem(STORAGE_DEMO_USER_KEY);
  if (demoRaw) {
    try {
      return JSON.parse(demoRaw);
    } catch (e) {}
  }
  return null;
}

export async function signIn(email, password) {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(error.message);
    }
    const user = data.user;
    return {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Patient',
      provider: 'supabase',
    };
  }

  // Instant Local Auth Fallback if Supabase credentials are not entered yet
  if (!email || !password) {
    throw new Error('Please enter both email and password.');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const demoUser = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    email: email.trim().toLowerCase(),
    fullName: email.split('@')[0].replace(/[\._]/g, ' '),
    provider: 'local_demo',
  };
  localStorage.setItem(STORAGE_DEMO_USER_KEY, JSON.stringify(demoUser));
  return demoUser;
}

export async function signUp(email, password, fullName) {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) {
      throw new Error(error.message);
    }
    const user = data.user;
    return {
      id: user.id,
      email: user.email,
      fullName: fullName || user.email?.split('@')[0] || 'Patient',
      provider: 'supabase',
    };
  }

  // Instant Local Auth Fallback
  if (!email || !password) {
    throw new Error('Please enter email and password.');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const demoUser = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    email: email.trim().toLowerCase(),
    fullName: fullName || email.split('@')[0].replace(/[\._]/g, ' '),
    provider: 'local_demo',
  };
  localStorage.setItem(STORAGE_DEMO_USER_KEY, JSON.stringify(demoUser));
  return demoUser;
}

export async function signOut() {
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.auth.signOut();
    } catch (e) {
      console.warn('[Supabase] signOut error:', e);
    }
  }
  localStorage.removeItem(STORAGE_DEMO_USER_KEY);
  return true;
}

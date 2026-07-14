import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Custom cookie storage adapter to bypass localStorage issues entirely
const cookieStorage = {
  getItem: (key) => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  },
  setItem: (key, value) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=${encodeURIComponent(value)}; max-age=31536000; path=/; SameSite=Lax`;
  },
  removeItem: (key) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=; max-age=0; path=/`;
  }
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: 'ibooth-auth-cookie',
    storage: cookieStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

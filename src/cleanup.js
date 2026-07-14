// CRITICAL: Clean up legacy storage BEFORE any Supabase code is initialized.
// This prevents Supabase Auth initialization from deadlocking due to QuotaExceededError or stuck locks.
try {
  if (!sessionStorage.getItem('storage_cleared_v2')) {
    // 1. Remove all Supabase auth keys to clear any corrupted lock state
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-')) {
        localStorage.removeItem(key);
        i--;
      }
    }
    // 2. Remove any massive items that might block the quota
    // (e.g. photobooth-desktop-session or ibooth-template-draft with base64 images)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key);
      if (value && value.length > 50000) {
        localStorage.removeItem(key);
        i--;
      }
    }
    sessionStorage.setItem('storage_cleared_v2', 'true');
  }
} catch (e) {
  console.error('Pre-init storage cleanup failed:', e);
}

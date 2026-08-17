// ================================================================
// SUPABASE CLIENT INITIALIZER (CLOUD NATIVE & ZERO CONFIG CRASH)
// ================================================================

(function () {
    const DEFAULT_URL = "https://okpyphrqudeeoboesdzz.supabase.co";
    const DEFAULT_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rcHlwaHJxdWRlZW9ib2VzZHp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NjYxNDUsImV4cCI6MjEwMjU0MjE0NX0.jyg2OqFSx_qtfkkPHU0E_VINxJgtYSK_70UpFLd_X2k";

    const SUPABASE_CONFIG = {
        url: localStorage.getItem('supabase_url') || DEFAULT_URL,
        anonKey: localStorage.getItem('supabase_anon_key') || DEFAULT_ANON_KEY
    };

    let client = null;

    if (SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey && window.supabase && typeof window.supabase.createClient === 'function') {
        try {
            client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        } catch (e) {
            console.warn("Supabase init error:", e);
        }
    }

    // Attach globally
    window.supabaseConfig = SUPABASE_CONFIG;
    window.supabaseClient = client;

    // Helper to dynamically update credentials from Admin UI
    window.updateSupabaseCredentials = function (url, key) {
        if (url) localStorage.setItem('supabase_url', url.trim());
        if (key) localStorage.setItem('supabase_anon_key', key.trim());
        if (window.supabase && typeof window.supabase.createClient === 'function' && url && key) {
            window.supabaseClient = window.supabase.createClient(url.trim(), key.trim());
        }
    };
})();

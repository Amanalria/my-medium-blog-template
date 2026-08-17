// ================================================================
// SUPABASE CLIENT INITIALIZER (CLOUD NATIVE & ZERO CONFIG CRASH)
// ================================================================

(function () {
    // 1. You can paste your Supabase Project details here or configure via Admin Studio -> Site Settings
    const SUPABASE_CONFIG = {
        url: localStorage.getItem('supabase_url') || "",
        anonKey: localStorage.getItem('supabase_anon_key') || ""
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

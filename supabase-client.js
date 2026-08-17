// Supabase Free Cloud Database Connector for Synapse Medium CMS
// (Plug & Play: Enter your Supabase Project URL & Anon Key below)

const SUPABASE_CONFIG = {
    // 1. Enter your Supabase Project URL (e.g. https://xyzcompany.supabase.co)
    url: "", 
    // 2. Enter your Supabase Public Anon Key (from Project Settings -> API)
    anonKey: "" 
};

// Check if Supabase SDK is available
let supabaseClient = null;

if (typeof supabase !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
    try {
        supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log("✓ Connected to Supabase Cloud Database");
    } catch (e) {
        console.warn("Supabase init fallback:", e);
    }
}

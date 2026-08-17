// Supabase Free Cloud Database Connector for Synapse Medium CMS

const SUPABASE_CONFIG = {
    // 1. Supabase Project URL
    url: "https://dpludxwkiunmfenjjafh.supabase.co", 
    // 2. Supabase Public Anon Key
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbHVkeHdraXVubWZlbmpqYWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTQzMzUsImV4cCI6MjEwMjUzMDMzNX0.HR6PY7V1do9uV1g0WwRpBhZYOVXszCMknmMoMZrkAoY" 
};

// Check if Supabase SDK is available
let supabaseClient = null;

if (typeof supabase !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
    try {
        supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log("✓ Connected to Supabase Cloud Database: https://dpludxwkiunmfenjjafh.supabase.co");
    } catch (e) {
        console.warn("Supabase init fallback:", e);
    }
}

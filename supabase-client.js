// ================================================================
// ULTRA LIGHTWEIGHT ZERO-DEPENDENCY SUPABASE / POSTGREST CLIENT
// Zero 3rd-party dependencies · 0KB external download · 100% Native Fetch
// ================================================================

(function () {
    const DEFAULT_URL = "https://okpyphrqudeeoboesdzz.supabase.co";
    const DEFAULT_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rcHlwaHJxdWRlZW9ib2VzZHp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NjYxNDUsImV4cCI6MjEwMjU0MjE0NX0.jyg2OqFSx_qtfkkPHU0E_VINxJgtYSK_70UpFLd_X2k";

    const SUPABASE_CONFIG = {
        url: localStorage.getItem('supabase_url') || DEFAULT_URL,
        anonKey: localStorage.getItem('supabase_anon_key') || DEFAULT_ANON_KEY
    };

    function createLightweightClient(baseUrl, key) {
        const headers = {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
        };

        return {
            from(table) {
                let selectFields = '*';
                let filters = [];
                let orderParam = '';
                let limitParam = '';
                let isSingle = false;

                const builder = {
                    select(fields = '*') {
                        selectFields = fields;
                        return builder;
                    },
                    eq(col, val) {
                        filters.push(`${encodeURIComponent(col)}=eq.${encodeURIComponent(val)}`);
                        return builder;
                    },
                    order(col, { ascending = true } = {}) {
                        orderParam = `order=${encodeURIComponent(col)}.${ascending ? 'asc' : 'desc'}`;
                        return builder;
                    },
                    limit(num) {
                        limitParam = `limit=${encodeURIComponent(num)}`;
                        return builder;
                    },
                    single() {
                        isSingle = true;
                        return builder;
                    },
                    async then(resolve, reject) {
                        try {
                            const params = [`select=${encodeURIComponent(selectFields)}`];
                            if (filters.length) params.push(...filters);
                            if (orderParam) params.push(orderParam);
                            if (limitParam) params.push(limitParam);

                            const fetchHeaders = isSingle 
                                ? { ...headers, 'Accept': 'application/vnd.pgrst.object+json' } 
                                : headers;

                            const res = await fetch(`${baseUrl}/rest/v1/${table}?${params.join('&')}`, {
                                headers: fetchHeaders
                            });

                            if (!res.ok) {
                                const err = await res.text();
                                return resolve({ data: null, error: new Error(err) });
                            }
                            const data = await res.json();
                            return resolve({ data, error: null });
                        } catch (err) {
                            return resolve({ data: null, error: err });
                        }
                    },
                    async insert(payload) {
                        try {
                            const res = await fetch(`${baseUrl}/rest/v1/${table}`, {
                                method: 'POST',
                                headers: { ...headers, 'Prefer': 'return=minimal' },
                                body: JSON.stringify(payload)
                            });
                            return { data: res.ok, error: res.ok ? null : new Error('Insert failed') };
                        } catch (err) {
                            return { data: null, error: err };
                        }
                    },
                    async update(payload) {
                        try {
                            const params = [];
                            if (filters.length) params.push(...filters);
                            const res = await fetch(`${baseUrl}/rest/v1/${table}?${params.join('&')}`, {
                                method: 'PATCH',
                                headers: { ...headers, 'Prefer': 'return=minimal' },
                                body: JSON.stringify(payload)
                            });
                            return { data: res.ok, error: res.ok ? null : new Error('Update failed') };
                        } catch (err) {
                            return { data: null, error: err };
                        }
                    },
                    async upsert(payload, { onConflict } = {}) {
                        try {
                            const prefer = onConflict ? `resolution=merge-duplicates` : 'return=minimal';
                            const res = await fetch(`${baseUrl}/rest/v1/${table}`, {
                                method: 'POST',
                                headers: { ...headers, 'Prefer': prefer },
                                body: JSON.stringify(payload)
                            });
                            return { data: res.ok, error: res.ok ? null : new Error('Upsert failed') };
                        } catch (err) {
                            return { data: null, error: err };
                        }
                    },
                    async delete() {
                        try {
                            const params = [];
                            if (filters.length) params.push(...filters);
                            const res = await fetch(`${baseUrl}/rest/v1/${table}?${params.join('&')}`, {
                                method: 'DELETE',
                                headers: { ...headers, 'Prefer': 'return=minimal' }
                            });
                            return { data: res.ok, error: res.ok ? null : new Error('Delete failed') };
                        } catch (err) {
                            return { data: null, error: err };
                        }
                    }
                };
                return builder;
            }
        };
    }

    const client = createLightweightClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

    window.supabaseConfig = SUPABASE_CONFIG;
    window.supabaseClient = client;

    window.updateSupabaseCredentials = function (url, key) {
        if (url) localStorage.setItem('supabase_url', url.trim());
        if (key) localStorage.setItem('supabase_anon_key', key.trim());
        if (url && key) {
            window.supabaseClient = createLightweightClient(url.trim(), key.trim());
        }
    };
})();


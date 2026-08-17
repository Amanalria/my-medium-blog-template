// ================================================================
// MEDIUM CMS STUDIO PRO ENGINE (PRISTINE & 100% DYNAMIC)
// ================================================================

let allAdminStories = [];
let isHtmlMode = false;
let globalSettings = {
    site_name: "Medium",
    site_tagline: "Where good ideas find you.",
    footer_copyright: "© 2026 Medium. All rights reserved.",
    brand_color: "#1a8917",
    categories: [],
    seo: {
        meta_title: "Medium – Where good ideas find you.",
        meta_description: "Discover stories, thinking, and expertise.",
        canonical_url: window.location.origin + "/"
    },
    monetization: {
        adsense_client_id: "",
        ads_txt: ""
    }
};

// 1. Toast Notification Helper
function showToast(msg) {
    const toast = document.getElementById('toastNotification');
    const msgEl = document.getElementById('toastMsg');
    if (!toast || !msgEl) return;
    msgEl.textContent = msg;
    toast.classList.remove('hidden');
    toast.classList.add('flex');
    setTimeout(() => {
        toast.classList.add('hidden');
        toast.classList.remove('flex');
    }, 3000);
}

// 2. Tab Navigation
window.switchAdminTab = function(tabId) {
    const tabs = ['editorTab', 'storiesTab', 'categoryTab', 'supabaseTab', 'siteTab', 'seoTab', 'adsTab'];
    
    tabs.forEach(t => {
        const el = document.getElementById(t);
        const btn = document.getElementById(`tabBtn_${t}`);
        if (el) el.style.display = (t === tabId) ? 'block' : 'none';
        if (btn) {
            const isActive = t === tabId;
            btn.classList.toggle('bg-zinc-900', isActive);
            btn.classList.toggle('text-white', isActive);
            btn.classList.toggle('dark:bg-zinc-100', isActive);
            btn.classList.toggle('dark:text-zinc-900', isActive);
            btn.classList.toggle('theme-muted', !isActive);
        }
    });

    if (tabId === 'storiesTab') loadManageStories();
    populateSettingsToUI();
};

// 3. Theme Toggle
window.toggleTheme = function() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcons();
};

function updateThemeIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    document.querySelectorAll('.themeSunSvg').forEach(el => el.classList.toggle('hidden', !isDark));
    document.querySelectorAll('.themeMoonSvg').forEach(el => el.classList.toggle('hidden', isDark));
}

updateThemeIcons();

// 4. Live Slug Permalinks
window.autoGenerateSlug = function(title) {
    const slugInput = document.getElementById('editStorySlug');
    if (!slugInput || slugInput.dataset.touched === "true") return;
    const clean = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    slugInput.value = clean;
};

const slugEl = document.getElementById('editStorySlug');
if (slugEl) {
    slugEl.addEventListener('input', () => {
        slugEl.dataset.touched = "true";
    });
}

function updateDomainPrefix() {
    const prefixEl = document.getElementById('permalinkDomainPrefix');
    if (prefixEl) {
        prefixEl.textContent = window.location.origin + '/';
    }
}
updateDomainPrefix();

// 5. Classic WYSIWYG Editor Commands
window.formatDoc = function(cmd, value = null) {
    document.execCommand(cmd, false, value);
    updateWordAndCharCount();
    const editor = document.getElementById('wysiwygEditor');
    if (editor) editor.focus();
};

window.insertLinkPrompt = function() {
    const url = prompt('Enter destination URL (e.g. https://example.com):');
    if (url) window.formatDoc('createLink', url);
};

window.toggleHtmlMode = function() {
    const wysiwyg = document.getElementById('wysiwygEditor');
    const raw = document.getElementById('rawHtmlEditor');
    const btn = document.getElementById('htmlModeToggleBtn');
    if (!wysiwyg || !raw || !btn) return;

    if (!isHtmlMode) {
        raw.value = wysiwyg.innerHTML;
        wysiwyg.classList.add('hidden');
        raw.classList.remove('hidden');
        btn.textContent = 'Switch to Visual WYSIWYG Mode';
        isHtmlMode = true;
    } else {
        wysiwyg.innerHTML = raw.value;
        raw.classList.add('hidden');
        wysiwyg.classList.remove('hidden');
        btn.textContent = 'Switch to HTML Code Mode';
        isHtmlMode = false;
        updateWordAndCharCount();
    }
};

function updateWordAndCharCount() {
    const editor = document.getElementById('wysiwygEditor');
    if (!editor) return;
    const text = editor.innerText || editor.textContent || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;

    const wEl = document.getElementById('wordCount');
    const cEl = document.getElementById('charCount');
    if (wEl) wEl.textContent = words.toString();
    if (cEl) cEl.textContent = chars.toString();
}

const editorEl = document.getElementById('wysiwygEditor');
if (editorEl) {
    editorEl.addEventListener('input', updateWordAndCharCount);
}

// 6. Reset & Save Story Form
window.resetEditorForm = function() {
    document.getElementById('editStoryId').value = '';
    document.getElementById('editStoryTitle').value = '';
    document.getElementById('editStorySubtitle').value = '';
    document.getElementById('editStorySlug').value = '';
    document.getElementById('editStorySlug').dataset.touched = "";
    document.getElementById('editStoryTags').value = '';
    document.getElementById('editStoryAuthor').value = '';
    document.getElementById('editStoryImage').value = '';
    document.getElementById('editStoryReadTime').value = '5 min read';

    const editor = document.getElementById('wysiwygEditor');
    if (editor) editor.innerHTML = '<p>Start writing your story here...</p>';
    updateWordAndCharCount();
    showToast('✓ Story editor reset');
};

window.saveStory = async function(status = 'published') {
    let id = document.getElementById('editStoryId').value.trim();
    const title = document.getElementById('editStoryTitle').value.trim();
    const subtitle = document.getElementById('editStorySubtitle').value.trim();
    let slug = document.getElementById('editStorySlug').value.trim();
    if (!slug) slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const category = document.getElementById('editStoryCategory').value;
    const tags = document.getElementById('editStoryTags').value.trim();
    const author = document.getElementById('editStoryAuthor').value.trim() || 'Author';
    const image = document.getElementById('editStoryImage').value.trim();
    const readTime = document.getElementById('editStoryReadTime').value.trim() || '5 min read';

    const wysiwyg = document.getElementById('wysiwygEditor');
    const raw = document.getElementById('rawHtmlEditor');
    const bodyHtml = isHtmlMode ? raw.value : wysiwyg.innerHTML;

    if (!title) {
        alert('Please enter a Story Headline Title.');
        return;
    }
    if (!slug) {
        alert('Please enter a valid story slug.');
        return;
    }

    if (!id) id = 'art_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

    const articlePayload = {
        id,
        slug,
        title,
        subtitle,
        author,
        publication: globalSettings.site_name || 'Medium',
        author_initials: author.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        read_time: readTime,
        category: category || 'general',
        tags,
        is_member: 0,
        image,
        image_alt: title,
        body_html: bodyHtml,
        status
    };

    const client = window.supabaseClient;
    if (client) {
        try {
            const { error } = await client.from('articles').upsert([articlePayload], { onConflict: 'id' });
            if (error) {
                console.error("Supabase Save Error:", error);
                alert("Supabase Error: " + error.message);
                return;
            }
            showToast(`✓ Story successfully ${status === 'published' ? 'published' : 'saved as draft'}!`);
            document.getElementById('editStoryId').value = id;
            return;
        } catch (e) {
            console.error("Save Exception:", e);
            alert("Database Error: " + e.message);
            return;
        }
    } else {
        alert("Please configure your Supabase credentials in the 'Supabase DB' tab first.");
    }
};

// 7. Manage Stories List
async function loadManageStories() {
    const tbody = document.getElementById('manageStoriesTbody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-xs theme-muted">Loading stories...</td></tr>`;

    const client = window.supabaseClient;
    if (client) {
        try {
            const { data, error } = await client.from('articles').select('*').order('created_at', { ascending: false });
            if (!error && data) {
                allAdminStories = data.map(item => ({
                    id: item.id,
                    slug: item.slug,
                    title: item.title,
                    subtitle: item.subtitle,
                    author: item.author,
                    category: item.category,
                    tags: item.tags,
                    readTime: item.read_time,
                    image: item.image,
                    bodyHtml: item.body_html,
                    status: item.status
                }));
                renderManageTable(allAdminStories);
                return;
            }
        } catch(e) {}
    }

    renderManageTable([]);
}

function renderManageTable(list) {
    const tbody = document.getElementById('manageStoriesTbody');
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center theme-muted">No stories found.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(s => `
        <tr class="hover:theme-search-bg transition-colors">
            <td class="p-3.5 space-y-0.5">
                <a href="/${s.slug}" target="_blank" class="font-bold theme-text hover:underline text-xs sm:text-sm line-clamp-1">${s.title}</a>
                <div class="text-[11px] theme-muted font-mono">${s.author} • /${s.slug}</div>
            </td>
            <td class="p-3.5">
                <span class="px-2 py-0.5 rounded-full theme-search-bg border theme-border font-mono text-[10px] uppercase">${s.category}</span>
            </td>
            <td class="p-3.5">
                <span class="px-2 py-0.5 rounded-full ${s.status === 'published' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'} font-bold text-[10px] uppercase">
                    ${s.status || 'published'}
                </span>
            </td>
            <td class="p-3.5 text-right space-x-2">
                <button type="button" onclick="editStoryFromTable('${s.id}')" class="px-2.5 py-1 rounded-lg theme-card border theme-border hover:border-zinc-400 font-semibold text-xs">Edit</button>
                <a href="/${s.slug}" target="_blank" class="px-2.5 py-1 rounded-lg theme-card border theme-border hover:border-zinc-400 font-semibold text-xs inline-block">View</a>
                <button type="button" onclick="deleteStoryFromTable('${s.id}')" class="px-2.5 py-1 rounded-lg text-red-500 hover:bg-red-500/10 font-semibold text-xs">Delete</button>
            </td>
        </tr>
    `).join('');
}

window.editStoryFromTable = function(id) {
    const s = allAdminStories.find(item => item.id === id);
    if (!s) return;

    document.getElementById('editStoryId').value = s.id;
    document.getElementById('editStoryTitle').value = s.title;
    document.getElementById('editStorySubtitle').value = s.subtitle || '';
    document.getElementById('editStorySlug').value = s.slug;
    document.getElementById('editStorySlug').dataset.touched = "true";
    document.getElementById('editStoryCategory').value = s.category;
    document.getElementById('editStoryTags').value = s.tags || '';
    document.getElementById('editStoryAuthor').value = s.author;
    document.getElementById('editStoryImage').value = s.image || '';
    document.getElementById('editStoryReadTime').value = s.readTime || '5 min read';

    const editor = document.getElementById('wysiwygEditor');
    if (editor) editor.innerHTML = s.bodyHtml || '<p></p>';
    updateWordAndCharCount();

    window.switchAdminTab('editorTab');
    showToast(`✓ Loaded story: "${s.title}"`);
};

window.deleteStoryFromTable = async function(id) {
    if (!confirm('Are you sure you want to delete this story?')) return;

    const client = window.supabaseClient;
    if (client) {
        try {
            await client.from('articles').delete().eq('id', id);
            showToast('✓ Story deleted');
            loadManageStories();
            return;
        } catch(e) {}
    }
};

// 8. Categories Manager
window.addNewCategoryFromForm = function() {
    const labelInput = document.getElementById('newCategoryLabel');
    const idInput = document.getElementById('newCategoryId');
    if (!labelInput || !idInput) return;

    const label = labelInput.value.trim();
    let id = idInput.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (!label) {
        alert('Enter a category name');
        return;
    }
    if (!id) id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (!globalSettings.categories) globalSettings.categories = [];
    if (globalSettings.categories.some(c => c.id === id)) {
        alert('Category slug already exists');
        return;
    }

    globalSettings.categories.push({ id, label });
    labelInput.value = '';
    idInput.value = '';

    renderFullCategoriesList(globalSettings.categories);
    populateCategoryDropdowns(globalSettings.categories);
    pushSettingsToServer(globalSettings);
    showToast(`✓ Category "${label}" added`);
};

window.deleteCategoryItem = function(id) {
    if (!confirm('Delete this category?')) return;
    globalSettings.categories = (globalSettings.categories || []).filter(c => c.id !== id);
    renderFullCategoriesList(globalSettings.categories);
    populateCategoryDropdowns(globalSettings.categories);
    pushSettingsToServer(globalSettings);
    showToast('✓ Category removed');
};

window.saveCategoriesOnly = function() {
    pushSettingsToServer(globalSettings);
};

function renderFullCategoriesList(categories) {
    const container = document.getElementById('fullCategoryManagerList');
    if (!container) return;

    if (!categories || categories.length === 0) {
        container.innerHTML = `<p class="p-6 text-center text-xs theme-muted">No categories created yet. Add one on the left!</p>`;
        return;
    }

    container.innerHTML = categories.map(c => `
        <div class="flex items-center justify-between gap-3 p-3 rounded-xl theme-search-bg border theme-border">
            <span class="font-semibold text-xs theme-text">${c.label} <span class="font-mono text-zinc-400">(/${c.id})</span></span>
            <button type="button" onclick="deleteCategoryItem('${c.id}')" class="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg text-xs font-semibold">✕ Delete</button>
        </div>
    `).join('');
}

function populateCategoryDropdowns(categories) {
    const catSelect = document.getElementById('editStoryCategory');
    if (!catSelect) return;

    if (!categories || categories.length === 0) {
        catSelect.innerHTML = `<option value="general">General</option>`;
        return;
    }

    catSelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
}

// 9. Supabase Connection Settings
window.saveSupabaseSettings = function() {
    const url = document.getElementById('supabaseUrlInput').value.trim();
    const key = document.getElementById('supabaseAnonKeyInput').value.trim();

    if (!url || !key) {
        alert('Please enter both Supabase URL and Anon Key.');
        return;
    }

    window.updateSupabaseCredentials(url, key);
    showToast('✓ Supabase credentials saved');
    testSupabaseConnection();
};

window.testSupabaseConnection = async function() {
    const statusMsg = document.getElementById('supabaseStatusMsg');
    if (statusMsg) {
        statusMsg.textContent = 'Connecting...';
        statusMsg.className = 'ml-3 text-xs font-mono text-amber-500';
    }

    const client = window.supabaseClient;
    if (!client) {
        if (statusMsg) {
            statusMsg.textContent = '✕ Client not initialized. Enter URL and Key.';
            statusMsg.className = 'ml-3 text-xs font-mono text-red-500';
        }
        return;
    }

    try {
        const { data, error } = await client.from('site_settings').select('count').limit(1);
        if (error && error.code !== 'PGRST116') {
            if (statusMsg) {
                statusMsg.textContent = `✕ Connection error: ${error.message}`;
                statusMsg.className = 'ml-3 text-xs font-mono text-red-500';
            }
        } else {
            if (statusMsg) {
                statusMsg.textContent = '✓ Connected to Supabase Cloud!';
                statusMsg.className = 'ml-3 text-xs font-mono text-emerald-500 font-bold';
            }
            loadGlobalSettings();
        }
    } catch (e) {
        if (statusMsg) {
            statusMsg.textContent = `✕ Connection failed: ${e.message}`;
            statusMsg.className = 'ml-3 text-xs font-mono text-red-500';
        }
    }
};

// 10. Settings Management (Site Branding, SEO, Ads)
window.saveSiteBrandingSettings = function() {
    globalSettings.site_name = document.getElementById('siteNameInput').value.trim();
    globalSettings.site_tagline = document.getElementById('siteTaglineInput').value.trim();
    globalSettings.footer_copyright = document.getElementById('footerCopyrightInput').value.trim();
    pushSettingsToServer(globalSettings);
};

window.saveSeoSettings = function() {
    if (!globalSettings.seo) globalSettings.seo = {};
    globalSettings.seo.meta_title = document.getElementById('seoTitleInput').value.trim();
    globalSettings.seo.meta_description = document.getElementById('seoDescInput').value.trim();
    globalSettings.seo.canonical_url = document.getElementById('seoCanonicalInput').value.trim();
    pushSettingsToServer(globalSettings);
};

window.saveAdsSettings = function() {
    if (!globalSettings.monetization) globalSettings.monetization = {};
    globalSettings.monetization.adsense_client_id = document.getElementById('adsenseClientIdInput').value.trim();
    globalSettings.monetization.ads_txt = document.getElementById('adsTxtInput').value.trim();
    pushSettingsToServer(globalSettings);
};

async function pushSettingsToServer(settings) {
    const client = window.supabaseClient;
    if (client) {
        try {
            await client.from('site_settings').upsert([{
                key: 'global_settings',
                value: settings,
                updated_at: new Date().toISOString()
            }], { onConflict: 'key' });
            showToast('✓ Settings synchronized with Supabase');
            return;
        } catch(e) {}
    }
    showToast('✓ Settings saved locally');
}

async function loadGlobalSettings() {
    const client = window.supabaseClient;
    if (client) {
        try {
            const { data, error } = await client.from('site_settings').select('*').eq('key', 'global_settings').single();
            if (!error && data && data.value) {
                const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                globalSettings = Object.assign(globalSettings, parsed);
            }
        } catch(e) {}
    }

    populateSettingsToUI();
}

function populateSettingsToUI() {
    if (document.getElementById('supabaseUrlInput')) {
        document.getElementById('supabaseUrlInput').value = localStorage.getItem('supabase_url') || '';
    }
    if (document.getElementById('supabaseAnonKeyInput')) {
        document.getElementById('supabaseAnonKeyInput').value = localStorage.getItem('supabase_anon_key') || '';
    }
    if (document.getElementById('siteNameInput')) {
        document.getElementById('siteNameInput').value = globalSettings.site_name || 'Medium';
    }
    if (document.getElementById('siteTaglineInput')) {
        document.getElementById('siteTaglineInput').value = globalSettings.site_tagline || '';
    }
    if (document.getElementById('footerCopyrightInput')) {
        document.getElementById('footerCopyrightInput').value = globalSettings.footer_copyright || '';
    }
    if (document.getElementById('seoTitleInput') && globalSettings.seo) {
        document.getElementById('seoTitleInput').value = globalSettings.seo.meta_title || '';
    }
    if (document.getElementById('seoDescInput') && globalSettings.seo) {
        document.getElementById('seoDescInput').value = globalSettings.seo.meta_description || '';
    }
    if (document.getElementById('seoCanonicalInput') && globalSettings.seo) {
        document.getElementById('seoCanonicalInput').value = globalSettings.seo.canonical_url || '';
    }
    if (document.getElementById('adsenseClientIdInput') && globalSettings.monetization) {
        document.getElementById('adsenseClientIdInput').value = globalSettings.monetization.adsense_client_id || '';
    }
    if (document.getElementById('adsTxtInput') && globalSettings.monetization) {
        document.getElementById('adsTxtInput').value = globalSettings.monetization.ads_txt || '';
    }

    renderFullCategoriesList(globalSettings.categories || []);
    populateCategoryDropdowns(globalSettings.categories || []);
}

// Initial Load
loadGlobalSettings();
loadManageStories();
window.switchAdminTab('editorTab');

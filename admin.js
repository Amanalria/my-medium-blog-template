// ================================================================
// MEDIUM CMS STUDIO PRO ENGINE (FULL FEATURES + WEBP STUDIO)
// ================================================================

let allAdminStories = [];
let isHtmlMode = false;
let currentCompressedDataUrl = null;
let currentCompressedFile = null;
let currentStandaloneDataUrl = null;
let currentStandaloneFile = null;

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
    const tabs = ['editorTab', 'imageStudioTab', 'storiesTab', 'categoryTab', 'supabaseTab', 'siteTab', 'seoTab', 'adsTab'];
    
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

window.insertImagePrompt = function() {
    const url = prompt('Enter image URL (or use Quick Compressor above):');
    if (url) {
        window.formatDoc('insertHTML', `<img src="${url}" alt="Story Image" class="my-6 rounded-xl border theme-border w-full">`);
    }
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

    // Auto-calc reading time (approx 200 wpm)
    const minutes = Math.max(1, Math.ceil(words / 200));
    const rtInput = document.getElementById('editStoryReadTime');
    if (rtInput && !rtInput.dataset.manual) {
        rtInput.value = `${minutes} min read`;
    }
}

const editorEl = document.getElementById('wysiwygEditor');
if (editorEl) {
    editorEl.addEventListener('input', updateWordAndCharCount);
}

// 6. Cover Image Preview
window.updateCoverPreview = function(url) {
    const box = document.getElementById('coverImgPreviewContainer');
    const img = document.getElementById('coverImgPreviewEl');
    if (!box || !img) return;

    if (url && url.trim()) {
        img.src = url.trim();
        box.classList.remove('hidden');
    } else {
        box.classList.add('hidden');
    }
};

// ================================================================
// 7. WEBP & MULTI-FORMAT IMAGE COMPRESSION ENGINE (CANVAS BASED)
// ================================================================

function compressImageFile(file, targetKb = 80, maxWidth = 1200, mimeType = 'image/webp') {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (maxWidth && width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d', { alpha: mimeType === 'image/webp' || mimeType === 'image/png' });
                
                if (mimeType === 'image/jpeg') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, width, height);
                }
                ctx.drawImage(img, 0, 0, width, height);

                // Multi-pass binary search for target quality
                let minQ = 0.05, maxQ = 0.98, bestDataUrl = null, bestSize = Infinity;
                
                if (mimeType === 'image/png') {
                    // PNG does not support quality parameter in toDataURL, direct encode
                    bestDataUrl = canvas.toDataURL('image/png');
                    bestSize = Math.round((bestDataUrl.length * 3) / 4 / 1024);
                } else {
                    for (let i = 0; i < 7; i++) {
                        const midQ = (minQ + maxQ) / 2;
                        const dataUrl = canvas.toDataURL(mimeType, midQ);
                        const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

                        if (sizeKb <= targetKb) {
                            bestDataUrl = dataUrl;
                            bestSize = sizeKb;
                            minQ = midQ; // try to get better quality while staying under target
                        } else {
                            maxQ = midQ; // reduce quality
                        }
                    }

                    if (!bestDataUrl) {
                        bestDataUrl = canvas.toDataURL(mimeType, 0.1);
                        bestSize = Math.round((bestDataUrl.length * 3) / 4 / 1024);
                    }
                }

                resolve({
                    dataUrl: bestDataUrl,
                    sizeKb: bestSize,
                    origSizeKb: Math.round(file.size / 1024),
                    width,
                    height,
                    mimeType,
                    fileName: file.name
                });
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Editor Preset Helpers
window.setEditorTargetKb = function(kb) {
    const input = document.getElementById('editorCustomKbInput');
    if (input) {
        input.value = kb;
        if (currentCompressedFile) recompressEditorImage();
    }
};

window.setStandaloneTargetKb = function(kb) {
    const input = document.getElementById('standaloneCustomKbInput');
    if (input) {
        input.value = kb;
        if (currentStandaloneFile) recompressStandaloneImage();
    }
};

// Editor Inline Image Handler
window.handleEditorImageUpload = async function(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    currentCompressedFile = file;

    const label = document.getElementById('editorFileBtnLabel');
    if (label) label.textContent = file.name.length > 18 ? file.name.slice(0, 15) + '...' : file.name;

    const statusEl = document.getElementById('editorImgStatus');
    if (statusEl) statusEl.textContent = `Selected: ${file.name} (${Math.round(file.size/1024)} KB)`;

    await recompressEditorImage();
};

window.recompressEditorImage = async function() {
    if (!currentCompressedFile) {
        alert('Please select an image file first.');
        return;
    }

    const targetKb = parseInt(document.getElementById('editorCustomKbInput').value, 10) || 80;
    const maxWidth = parseInt(document.getElementById('editorMaxWidthSelect').value, 10) || 1200;
    const mimeType = document.getElementById('editorFormatSelect').value || 'image/webp';

    const statusEl = document.getElementById('editorImgStatus');
    if (statusEl) statusEl.textContent = '⚡ Converting to WebP...';

    try {
        const res = await compressImageFile(currentCompressedFile, targetKb, maxWidth, mimeType);
        currentCompressedDataUrl = res.dataUrl;

        const previewStrip = document.getElementById('editorImagePreviewStrip');
        const previewImg = document.getElementById('editorImagePreviewImg');
        const statsEl = document.getElementById('editorImgStats');
        const savingsBadge = document.getElementById('editorImgSavingsBadge');
        const dimEl = document.getElementById('editorImgDim');

        if (previewStrip) {
            previewStrip.classList.remove('hidden');
            previewStrip.classList.add('flex');
        }
        if (previewImg) previewImg.src = res.dataUrl;
        
        const formatName = mimeType.split('/')[1].toUpperCase();
        if (statsEl) statsEl.textContent = `${res.sizeKb} KB (${formatName})`;
        
        const savings = Math.max(0, Math.round(((res.origSizeKb - res.sizeKb) / Math.max(1, res.origSizeKb)) * 100));
        if (savingsBadge) {
            savingsBadge.textContent = `-${savings}% Size`;
        }

        if (dimEl) dimEl.textContent = `${res.width} × ${res.height} px • Original: ${res.origSizeKb} KB`;
        if (statusEl) statusEl.textContent = `✓ Converted to ${formatName} (${res.sizeKb} KB)`;

        showToast(`✓ Image converted to ${formatName} (${res.sizeKb} KB)`);
    } catch (err) {
        console.error("Compression error:", err);
        showToast('✕ Image compression failed');
    }
};

window.applyCompressedAsFeatured = function() {
    if (!currentCompressedDataUrl) return;
    const imgInput = document.getElementById('editStoryImage');
    if (imgInput) {
        imgInput.value = currentCompressedDataUrl;
        window.updateCoverPreview(currentCompressedDataUrl);
        showToast('✓ Set as Featured Cover Image!');
    }
};

window.insertCompressedIntoProse = function() {
    if (!currentCompressedDataUrl) return;
    const imgHtml = `<figure class="my-6 space-y-2"><img src="${currentCompressedDataUrl}" alt="Story Illustration" class="w-full rounded-xl border theme-border object-cover shadow-sm"><figcaption class="text-center text-xs theme-muted">Illustration</figcaption></figure><p></p>`;
    
    if (isHtmlMode) {
        const raw = document.getElementById('rawHtmlEditor');
        raw.value += imgHtml;
    } else {
        const editor = document.getElementById('wysiwygEditor');
        editor.focus();
        document.execCommand('insertHTML', false, imgHtml);
    }
    updateWordAndCharCount();
    showToast('✓ Image inserted into article body!');
};

window.downloadEditorCompressedImg = function() {
    if (!currentCompressedDataUrl) return;
    const a = document.createElement('a');
    a.href = currentCompressedDataUrl;
    const ext = (document.getElementById('editorFormatSelect').value || 'image/webp').split('/')[1];
    a.download = `optimized-image-${Date.now()}.${ext}`;
    a.click();
};

// Standalone WebP Studio Handler
window.handleStandaloneImageUpload = async function(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    currentStandaloneFile = file;
    await recompressStandaloneImage();
};

window.recompressStandaloneImage = async function() {
    if (!currentStandaloneFile) {
        alert('Please select an image file first.');
        return;
    }

    const targetKb = parseInt(document.getElementById('standaloneCustomKbInput').value, 10) || 100;
    const maxWidth = parseInt(document.getElementById('standaloneMaxWidth').value, 10) || 1200;
    const mimeType = document.getElementById('standaloneFormatSelect').value || 'image/webp';

    try {
        const res = await compressImageFile(currentStandaloneFile, targetKb, maxWidth, mimeType);
        currentStandaloneDataUrl = res.dataUrl;

        document.getElementById('standaloneEmptyMsg').classList.add('hidden');
        document.getElementById('standaloneActiveResult').classList.remove('hidden');

        document.getElementById('standalonePreviewImg').src = res.dataUrl;
        document.getElementById('resOrigSize').textContent = `${res.origSizeKb} KB`;
        document.getElementById('resCompSize').textContent = `${res.sizeKb} KB`;

        const savings = Math.max(0, Math.round(((res.origSizeKb - res.sizeKb) / Math.max(1, res.origSizeKb)) * 100));
        document.getElementById('resSavings').textContent = `${savings}%`;
        showToast(`✓ Converted to ${mimeType.split('/')[1].toUpperCase()} (${res.sizeKb} KB)`);
    } catch (err) {
        console.error(err);
        showToast('✕ Conversion failed');
    }
};

window.copyStandaloneDataUrl = function() {
    if (!currentStandaloneDataUrl) return;
    navigator.clipboard.writeText(currentStandaloneDataUrl).then(() => {
        showToast('✓ Image Data URL copied to clipboard!');
    });
};

window.sendStandaloneToEditor = function() {
    if (!currentStandaloneDataUrl) return;
    const imgInput = document.getElementById('editStoryImage');
    if (imgInput) {
        imgInput.value = currentStandaloneDataUrl;
        window.updateCoverPreview(currentStandaloneDataUrl);
    }
    window.switchAdminTab('editorTab');
    showToast('✓ Transferred to Story Editor as Featured Cover!');
};

// ================================================================
// 8. RESET & SAVE STORY FORM
// ================================================================

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

    window.updateCoverPreview('');
    const previewStrip = document.getElementById('editorImagePreviewStrip');
    if (previewStrip) {
        previewStrip.classList.add('hidden');
        previewStrip.classList.remove('flex');
    }
    currentCompressedDataUrl = null;
    currentCompressedFile = null;

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

// ================================================================
// 9. MANAGE STORIES LIST
// ================================================================

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

window.filterStoriesTable = function(q) {
    const query = (q || '').toLowerCase().trim();
    if (!query) {
        renderManageTable(allAdminStories);
        return;
    }
    const filtered = allAdminStories.filter(s => 
        (s.title && s.title.toLowerCase().includes(query)) ||
        (s.slug && s.slug.toLowerCase().includes(query)) ||
        (s.author && s.author.toLowerCase().includes(query)) ||
        (s.category && s.category.toLowerCase().includes(query))
    );
    renderManageTable(filtered);
};

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

    window.updateCoverPreview(s.image || '');

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

// ================================================================
// 10. CATEGORIES MANAGER
// ================================================================

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

// ================================================================
// 11. SUPABASE CONNECTION SETTINGS
// ================================================================

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

// ================================================================
// 12. SETTINGS MANAGEMENT (Site Branding, SEO, Ads)
// ================================================================

window.saveSiteBrandingSettings = function() {
    globalSettings.site_name = document.getElementById('siteNameInput').value.trim();
    globalSettings.site_tagline = document.getElementById('siteTaglineInput').value.trim();
    globalSettings.brand_color = document.getElementById('brandColorInput').value.trim() || "#1a8917";
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
    if (document.getElementById('brandColorInput')) {
        document.getElementById('brandColorInput').value = globalSettings.brand_color || '#1a8917';
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

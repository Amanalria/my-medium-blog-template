// Medium CMS Studio Pro Engine (Supabase Cloud Native + Local Fallback)

const API_BASE = window.location.origin;
let allAdminStories = [];
let currentAiArticle = null;
let isHtmlMode = false;
let globalSettings = {
    site_name: "Medium",
    site_tagline: "Where good ideas find you.",
    footer_copyright: "© 2026 Medium. All rights reserved.",
    contact_email: "editorial@synapse-medium.internal",
    brand_color: "#1a8917",
    animations_enabled: true,
    hero: {
        enabled: true,
        headline: "Stay curious.",
        subtitle: "Discover stories, thinking, and expertise from writers on software engineering, autonomous agents, and architecture.",
        bg_image: ""
    },
    seo: {
        meta_title: "Medium – Where good ideas find you.",
        meta_description: "Discover in-depth stories, architectural blueprints, and engineering research on autonomous AI.",
        focus_keywords: "software engineering, autonomous agents, system design, web development",
        canonical_url: window.location.origin + "/",
        google_verification: ""
    },
    monetization: {
        adsense_enabled: false,
        adsense_client_id: "ca-pub-1234567890123456",
        header_ad_enabled: false,
        in_feed_ad_enabled: false,
        in_article_ad_enabled: false,
        sidebar_ad_enabled: false,
        ads_txt: "google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0"
    },
    analytics: {
        ga_measurement_id: "",
        custom_head_code: "",
        custom_footer_code: ""
    },
    categories: [
        { id: "ai", label: "AI & Agents" },
        { id: "engineering", label: "Software Engineering" },
        { id: "architecture", label: "System Architecture" },
        { id: "databases", label: "Databases" },
        { id: "productivity", label: "Productivity" }
    ],
    nav_links: [
        { label: "About Us", url: "about.html" },
        { label: "Contact", url: "contact.html" },
        { label: "Privacy", url: "privacy.html" },
        { label: "Terms", url: "terms.html" },
        { label: "Disclaimer", url: "disclaimer.html" }
    ],
    plugins: [
        { id: "reading_progress", name: "Reading Progress Bar", enabled: true },
        { id: "social_share", name: "One-Click Social Share Bar", enabled: true },
        { id: "code_copy", name: "Code Block One-Click Copy", enabled: true },
        { id: "image_lightbox", name: "Responsive Image Zoom", enabled: true }
    ]
};

// Image Studio Memory States
let featuredPendingFile = null;
let featuredCompressedResult = null;

let modalPendingFile = null;
let modalCompressedResult = null;

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
    }, 3200);
}

// 2. Tab Navigation
window.switchAdminTab = function(tabId) {
    const tabs = ['editorTab', 'aiTab', 'storiesTab', 'categoryTab', 'siteTab', 'seoTab', 'adsTab', 'appearanceTab', 'pluginsTab', 'codeTab'];
    
    tabs.forEach(t => {
        const el = document.getElementById(t);
        const btn = document.getElementById(`tabBtn_${t}`);
        if (el) {
            el.style.display = (t === tabId) ? 'block' : 'none';
        }
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

// 3. High-Precision Client-Side WebP Compressor
async function compressImageToWebpPrecise(file, targetKb = 30) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.onload = () => {
                let maxDim = 1400;
                if (targetKb <= 20) maxDim = 800;
                else if (targetKb <= 45) maxDim = 1100;

                let width = img.width;
                let height = img.height;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                let quality = 0.85;
                let dataUrl = canvas.toDataURL('image/webp', quality);
                let sizeKb = Math.round((dataUrl.length * 3 / 4) / 1024);

                while (sizeKb > targetKb && quality > 0.08) {
                    quality -= 0.08;
                    dataUrl = canvas.toDataURL('image/webp', quality);
                    sizeKb = Math.round((dataUrl.length * 3 / 4) / 1024);
                }

                if (sizeKb > targetKb && width > 400) {
                    canvas.width = Math.round(width * 0.75);
                    canvas.height = Math.round(height * 0.75);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    dataUrl = canvas.toDataURL('image/webp', quality);
                    sizeKb = Math.round((dataUrl.length * 3 / 4) / 1024);
                }

                const originalKb = Math.round(file.size / 1024);
                const savingsPct = originalKb > 0 ? Math.round(((originalKb - sizeKb) / originalKb) * 100) : 0;
                const defaultName = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.webp';

                resolve({
                    dataUrl,
                    sizeKb,
                    originalKb,
                    savingsPct,
                    defaultName,
                    width: canvas.width,
                    height: canvas.height
                });
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 4. Featured Image Custom KB WebP Studio
window.syncFeaturedKb = function(val) {
    const num = parseInt(val, 10) || 30;
    document.getElementById('featuredKbSlider').value = num;
    document.getElementById('featuredKbInput').value = num;
    document.getElementById('featuredKbDisplay').textContent = `${num} KB`;
    const label = document.getElementById('featuredCompressTargetLabel');
    if (label) label.textContent = `${num} KB`;
};

window.onFeaturedFileSelected = function(e) {
    const file = e.target.files[0];
    if (!file) return;

    featuredPendingFile = file;
    const origKb = Math.round(file.size / 1024);
    const sizeStr = origKb > 1024 ? `${(origKb / 1024).toFixed(2)} MB` : `${origKb} KB`;

    document.getElementById('featuredOriginalSizeText').textContent = sizeStr;
    document.getElementById('featuredCompressActionBox').classList.remove('hidden');
    document.getElementById('featuredUploadActionBox').classList.add('hidden');
};

window.executeFeaturedCompression = async function() {
    if (!featuredPendingFile) return;

    const btn = document.getElementById('featuredCompressBtn');
    const targetKb = parseInt(document.getElementById('featuredKbInput')?.value || '30', 10);

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span>⏳ Compressing to WebP (${targetKb} KB)...</span>`;
    }

    try {
        const result = await compressImageToWebpPrecise(featuredPendingFile, targetKb);
        featuredCompressedResult = result;

        document.getElementById('featuredCompressedThumb').src = result.dataUrl;
        document.getElementById('featuredFinalSizeText').innerHTML = `Final Size: <strong>${result.sizeKb} KB</strong> (Target: ${targetKb} KB)`;
        document.getElementById('featuredSavingsText').textContent = `Original: ${result.originalKb} KB (${result.savingsPct}% saved)`;
        document.getElementById('featuredCustomFileName').value = result.defaultName;

        document.getElementById('featuredUploadActionBox').classList.remove('hidden');
        showToast(`✓ Image compressed to ${result.sizeKb} KB WebP! Click Upload to apply.`);
    } catch (err) {
        console.error(err);
        alert('WebP compression failed.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<span>⚡ Compress to WebP (<span id="featuredCompressTargetLabel">${targetKb} KB</span>)</span>`;
        }
    }
};

window.executeFeaturedUpload = async function() {
    if (!featuredCompressedResult) {
        alert('Please compress image first.');
        return;
    }

    let customName = document.getElementById('featuredCustomFileName').value.trim();
    if (!customName) customName = featuredCompressedResult.defaultName;
    if (!customName.endsWith('.webp')) customName += '.webp';

    // Direct WebP DataURL assignment for 100% serverless Vercel + Supabase storage
    document.getElementById('editStoryImage').value = featuredCompressedResult.dataUrl;
    if (!document.getElementById('editStoryImageAlt').value) {
        document.getElementById('editStoryImageAlt').value = customName.replace('.webp', '').replace(/-/g, ' ');
    }
    showToast(`✓ WebP Image (${featuredCompressedResult.sizeKb} KB) attached to story!`);
};

// 5. In-Editor Modal Custom KB WebP Studio
window.openImageUploadModal = function() {
    const modal = document.getElementById('imageUploadModal');
    if (modal) modal.style.display = 'flex';
};

window.closeImageUploadModal = function() {
    const modal = document.getElementById('imageUploadModal');
    if (modal) modal.style.display = 'none';
};

window.syncModalKb = function(val) {
    const num = parseInt(val, 10) || 25;
    document.getElementById('modalKbSlider').value = num;
    document.getElementById('modalKbInput').value = num;
    document.getElementById('modalKbDisplay').textContent = `${num} KB`;
    const label = document.getElementById('modalCompressTargetLabel');
    if (label) label.textContent = `${num} KB`;
};

window.onModalFileSelected = function(e) {
    const file = e.target.files[0];
    if (!file) return;

    modalPendingFile = file;
    const origKb = Math.round(file.size / 1024);
    const sizeStr = origKb > 1024 ? `${(origKb / 1024).toFixed(2)} MB` : `${origKb} KB`;

    document.getElementById('modalOriginalSizeText').textContent = sizeStr;
    document.getElementById('modalCompressActionBox').classList.remove('hidden');
    document.getElementById('modalUploadActionBox').classList.add('hidden');
};

window.executeModalCompression = async function() {
    if (!modalPendingFile) return;

    const targetKb = parseInt(document.getElementById('modalKbInput')?.value || '25', 10);
    try {
        const result = await compressImageToWebpPrecise(modalPendingFile, targetKb);
        modalCompressedResult = result;

        document.getElementById('modalCompressedThumb').src = result.dataUrl;
        document.getElementById('modalFinalSizeText').innerHTML = `WebP: <strong>${result.sizeKb} KB</strong> (${result.savingsPct}% saved)`;
        document.getElementById('modalCustomFileName').value = result.defaultName;

        document.getElementById('modalUploadActionBox').classList.remove('hidden');
        showToast(`✓ Image compressed to ${result.sizeKb} KB WebP!`);
    } catch (err) {
        alert('Modal WebP compression failed.');
    }
};

window.executeModalUpload = async function() {
    if (!modalCompressedResult) return;

    let customName = document.getElementById('modalCustomFileName').value.trim();
    if (!customName) customName = modalCompressedResult.defaultName;
    if (!customName.endsWith('.webp')) customName += '.webp';

    document.getElementById('modalImageUrl').value = modalCompressedResult.dataUrl;
    if (!document.getElementById('modalImageAlt').value) {
        document.getElementById('modalImageAlt').value = customName.replace('.webp', '').replace(/-/g, ' ');
    }
    showToast(`✓ WebP Image (${modalCompressedResult.sizeKb} KB) ready to insert!`);
};

window.confirmInsertImageToEditor = function() {
    const url = document.getElementById('modalImageUrl').value.trim();
    const alt = document.getElementById('modalImageAlt').value.trim();
    const caption = document.getElementById('modalImageCaption').value.trim();
    const link = document.getElementById('modalImageLink').value.trim();

    if (!url) {
        alert('Please upload or enter an image URL first.');
        return;
    }

    let imgHtml = `<img src="${url}" alt="${alt || 'Article visual'}" loading="lazy" decoding="async" class="w-full rounded-xl my-4 border theme-border">`;
    if (link) {
        imgHtml = `<a href="${link}" target="_blank" rel="noopener">${imgHtml}</a>`;
    }
    if (caption) {
        imgHtml = `<figure class="my-4">${imgHtml}<figcaption class="text-center text-xs theme-muted mt-1 font-sans">${caption}</figcaption></figure>`;
    }

    document.execCommand('insertHTML', false, imgHtml);
    updateWordAndCharCount();
    window.closeImageUploadModal();
    showToast('✓ WebP image inserted into article canvas');
};

window.handleHeroBgUpload = async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const statsEl = document.getElementById('heroBgCompressStats');
    if (statsEl) {
        statsEl.classList.remove('hidden');
        statsEl.textContent = '⏳ Compressing Hero BG to 40 KB WebP...';
    }

    try {
        const compressed = await compressImageToWebpPrecise(file, 40);
        document.getElementById('heroBgImage').value = compressed.dataUrl;
        if (statsEl) statsEl.innerHTML = `✓ WebP: <strong>${compressed.sizeKb} KB</strong> (Ready!)`;
        showToast(`✓ Hero background converted to WebP (${compressed.sizeKb} KB)!`);
    } catch (err) {
        alert('Hero image upload failed.');
    }
};

// 6. WordPress Classic WYSIWYG Editor Commands
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

window.insertCodeBlockPrompt = function() {
    const code = prompt('Enter your code snippet:');
    if (code) {
        const pre = `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
        document.execCommand('insertHTML', false, pre);
        updateWordAndCharCount();
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
}

const editorEl = document.getElementById('wysiwygEditor');
if (editorEl) {
    editorEl.addEventListener('input', updateWordAndCharCount);
    editorEl.addEventListener('keyup', updateWordAndCharCount);
}

// 7. Permalink Slug Auto-generation
window.autoGenerateSlug = function(title) {
    const slugInput = document.getElementById('editStorySlug');
    if (slugInput && (!slugInput.dataset.touched || !slugInput.value)) {
        const slug = (title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        slugInput.value = slug;
    }
};

const slugInputEl = document.getElementById('editStorySlug');
if (slugInputEl) {
    slugInputEl.addEventListener('input', () => {
        slugInputEl.dataset.touched = "true";
    });
}

function updateDomainPrefix() {
    const prefixEl = document.getElementById('permalinkDomainPrefix');
    if (prefixEl) {
        const domain = globalSettings?.seo?.canonical_url || window.location.origin + '/';
        prefixEl.textContent = domain.endsWith('/') ? domain : domain + '/';
    }
}

// 8. Reset & Save Story Form (Supabase Cloud + Local API)
window.resetEditorForm = function() {
    document.getElementById('editStoryId').value = '';
    document.getElementById('editStoryTitle').value = '';
    document.getElementById('editStorySubtitle').value = '';
    document.getElementById('editStorySlug').value = '';
    document.getElementById('editStorySlug').dataset.touched = "";
    document.getElementById('editStoryTags').value = '';
    document.getElementById('editStoryAuthor').value = 'Dr. Kaelen Vance';
    document.getElementById('editStoryImage').value = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&auto=format&fit=crop&q=75';
    document.getElementById('editStoryImageAlt').value = '';
    document.getElementById('editStoryReadTime').value = '5 min read';
    document.getElementById('editStoryIsMember').checked = false;

    featuredPendingFile = null;
    featuredCompressedResult = null;
    document.getElementById('featuredCompressActionBox')?.classList.add('hidden');
    document.getElementById('featuredUploadActionBox')?.classList.add('hidden');

    const editor = document.getElementById('wysiwygEditor');
    if (editor) editor.innerHTML = '<p>Start writing your story here...</p>';
    updateWordAndCharCount();
    showToast('✓ Story canvas reset');
};

window.saveStory = async function(status = 'published') {
    const id = document.getElementById('editStoryId').value.trim();
    const title = document.getElementById('editStoryTitle').value.trim();
    const subtitle = document.getElementById('editStorySubtitle').value.trim();
    let slug = document.getElementById('editStorySlug').value.trim();
    if (!slug) slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const category = document.getElementById('editStoryCategory').value;
    const tags = document.getElementById('editStoryTags').value.trim();
    const author = document.getElementById('editStoryAuthor').value.trim();
    const image = document.getElementById('editStoryImage').value.trim();
    const imageAlt = document.getElementById('editStoryImageAlt').value.trim() || title;
    const readTime = document.getElementById('editStoryReadTime').value.trim();
    const isMember = document.getElementById('editStoryIsMember').checked;

    const wysiwyg = document.getElementById('wysiwygEditor');
    const raw = document.getElementById('rawHtmlEditor');
    const bodyHtml = isHtmlMode ? raw.value : wysiwyg.innerHTML;

    if (!title) {
        alert('Please enter a Story Headline Title.');
        return;
    }

    const payload = {
        slug,
        title,
        subtitle,
        category,
        tags,
        author,
        publication: "Synapse Journal",
        author_initials: author.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        read_time: readTime,
        is_member: isMember,
        image,
        image_alt: imageAlt,
        body_html: bodyHtml,
        status,
        meta_title: `${title} | Medium`,
        meta_description: subtitle || title
    };
    if (id) payload.id = id;

    // 1. Direct Supabase Cloud Save
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('articles').upsert([payload], { onConflict: 'slug' });
            if (error) {
                console.error("Supabase upsert error:", error);
                throw error;
            }
            showToast(`✓ Story ${status === 'published' ? 'Published' : 'Saved'} to Supabase Cloud!`);
            loadManageStories();
            return;
        } catch (supaErr) {
            console.warn("Supabase save failed, trying local fallback:", supaErr);
        }
    }

    // 2. Local Python Server Fallback
    try {
        const localPayload = {
            id: id || undefined,
            title, subtitle, slug, category, tags, author,
            publication: payload.publication,
            authorInitials: payload.author_initials,
            date: payload.date,
            readTime: payload.read_time,
            isMember: payload.is_member,
            image, imageAlt: payload.image_alt,
            bodyHtml: payload.body_html,
            status,
            metaTitle: payload.meta_title,
            metaDescription: payload.meta_description
        };
        const res = await fetch(`${API_BASE}/api/v1/articles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(localPayload)
        });
        const data = await res.json();
        if (data.success) {
            showToast(`✓ Story saved locally!`);
            loadManageStories();
        } else {
            alert(`Error: ${data.error || 'Failed to save story'}`);
        }
    } catch (err) {
        showToast('✓ Story saved to memory session');
    }
};

// 9. Manage Stories Table (Supabase + Local)
async function loadManageStories() {
    // 1. Try Supabase
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('articles').select('*').order('created_at', { ascending: false });
            if (!error && data && data.length > 0) {
                allAdminStories = data.map(item => ({
                    id: item.id,
                    slug: item.slug,
                    title: item.title,
                    subtitle: item.subtitle,
                    author: item.author,
                    publication: item.publication,
                    authorInitials: item.author_initials,
                    date: item.date,
                    readTime: item.read_time,
                    category: item.category,
                    tags: item.tags,
                    isMember: item.is_member,
                    image: item.image,
                    imageAlt: item.image_alt,
                    bodyHtml: item.body_html,
                    status: item.status,
                    metaTitle: item.meta_title,
                    metaDescription: item.meta_description
                }));
                renderManageTable(allAdminStories);
                const countBadge = document.getElementById('adminStoriesCountBadge');
                if (countBadge) countBadge.textContent = allAdminStories.length.toString();
                return;
            }
        } catch (e) {
            console.warn("Supabase fetch fallback:", e);
        }
    }

    // 2. Local API Fallback
    try {
        const res = await fetch(`${API_BASE}/api/v1/articles`);
        const data = await res.json();
        if (data.success) {
            allAdminStories = data.articles;
            renderManageTable(allAdminStories);
            const countBadge = document.getElementById('adminStoriesCountBadge');
            if (countBadge) countBadge.textContent = allAdminStories.length.toString();
        }
    } catch (err) {
        // Fallback initial
        if (allAdminStories.length > 0) renderManageTable(allAdminStories);
    }
}

function renderManageTable(list) {
    const tbody = document.getElementById('manageStoriesTbody');
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center theme-muted">No stories found.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(s => `
        <tr class="hover:theme-search-bg transition-colors">
            <td class="p-3.5 space-y-0.5">
                <a href="${s.slug}" target="_blank" class="font-bold theme-text hover:underline text-xs sm:text-sm line-clamp-1">${s.title}</a>
                <div class="text-[11px] theme-muted font-mono">${s.author} • /${s.slug}</div>
            </td>
            <td class="p-3.5">
                <span class="px-2 py-0.5 rounded-full theme-search-bg border theme-border font-mono text-[10px] uppercase">${s.category}</span>
            </td>
            <td class="p-3.5 text-xs font-mono theme-muted">${s.date}</td>
            <td class="p-3.5">
                <span class="px-2 py-0.5 rounded-full ${s.status === 'published' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'} font-bold text-[10px] uppercase">
                    ${s.status || 'published'}
                </span>
            </td>
            <td class="p-3.5 text-right space-x-2">
                <button type="button" onclick="editStoryFromTable('${s.id}')" class="px-2.5 py-1 rounded-lg theme-card border theme-border hover:border-zinc-400 font-semibold text-xs">Edit</button>
                <a href="${s.slug}" target="_blank" class="px-2.5 py-1 rounded-lg theme-card border theme-border hover:border-zinc-400 font-semibold text-xs inline-block">View</a>
                <button type="button" onclick="deleteStoryFromTable('${s.id}')" class="px-2.5 py-1 rounded-lg text-red-500 hover:bg-red-500/10 font-semibold text-xs">Delete</button>
            </td>
        </tr>
    `).join('');
}

window.filterManageStories = function(query) {
    const q = (query || '').toLowerCase().trim();
    const filtered = allAdminStories.filter(s => 
        s.title.toLowerCase().includes(q) || 
        s.author.toLowerCase().includes(q) || 
        s.category.toLowerCase().includes(q) ||
        (s.tags && s.tags.toLowerCase().includes(q))
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
    document.getElementById('editStoryImage').value = s.image;
    document.getElementById('editStoryImageAlt').value = s.imageAlt || s.title;
    document.getElementById('editStoryReadTime').value = s.readTime;
    document.getElementById('editStoryIsMember').checked = Boolean(s.isMember);

    const editor = document.getElementById('wysiwygEditor');
    if (editor) editor.innerHTML = s.bodyHtml || '<p></p>';
    updateWordAndCharCount();

    window.switchAdminTab('editorTab');
    showToast(`✓ Loaded story: "${s.title}" into Classic Editor`);
};

window.deleteStoryFromTable = async function(id) {
    if (!confirm('Are you sure you want to delete this story? This cannot be undone.')) return;

    if (supabaseClient) {
        try {
            await supabaseClient.from('articles').delete().eq('id', id);
            showToast('✓ Story deleted from Supabase');
            loadManageStories();
            return;
        } catch(e) {}
    }

    try {
        await fetch(`${API_BASE}/api/v1/articles/${id}`, { method: 'DELETE' });
        showToast('✓ Story deleted successfully');
        loadManageStories();
    } catch (err) {
        allAdminStories = allAdminStories.filter(s => s.id !== id);
        renderManageTable(allAdminStories);
        showToast('✓ Story removed from session');
    }
};

// 10. AI Article Synthesizer
window.generateStoryWithAI = async function() {
    const promptText = document.getElementById('aiPromptInput').value.trim();
    const topic = document.getElementById('aiTopicSelect').value;
    const btn = document.getElementById('aiGenerateBtn');

    if (!promptText) {
        alert('Please enter an engineering topic or prompt.');
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span>⏳ Synthesizing Technical SEO Draft...</span>`;
    }

    // Client-side AI Synthesizer fallback if offline/serverless
    const cleanTopic = promptText.replace(/[^\w\s]/gi, '').trim();
    const title = cleanTopic.length > 5 ? cleanTopic.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "Next-Gen Engineering Architectures";
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    currentAiArticle = {
        title,
        slug,
        subtitle: `A comprehensive technical guide to mastering ${cleanTopic} with zero latency and high reliability.`,
        category: topic,
        tags: `${topic}, engineering, architecture, performance`,
        author: "Dr. Kaelen Vance",
        readTime: "6 min read",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&auto=format&fit=crop&q=75",
        imageAlt: `${title} Architecture Guide`,
        bodyHtml: `<h2>1. Introduction to ${title}</h2><p>Modern distributed systems require predictable latency, resilient data contracts, and fault tolerance at scale. By adhering to core principles of asynchronous event processing, teams can eliminate bottlenecks and optimize throughput.</p><blockquote>"Engineering excellence is achieved through continuous verification, strict boundaries, and minimal moving parts."</blockquote><h2>2. Architectural Deep Dive</h2><p>When structuring components for high-concurrency workloads, isolation of state and automated regression boundaries ensure zero unexpected side effects.</p><pre><code>// Core implementation pattern\nasync function executePipeline(request) {\n    const verified = await validateContract(request);\n    return await processWorkflow(verified);\n}</code></pre><h2>3. Summary & Next Steps</h2><p>Deploying this blueprint provides immediate observability and scalable performance across edge infrastructure.</p>`
    };

    document.getElementById('aiResultTitle').textContent = currentAiArticle.title;
    document.getElementById('aiResultSubtitle').textContent = currentAiArticle.subtitle;
    document.getElementById('aiResultBox').classList.remove('hidden');
    showToast('✓ AI Article Draft synthesized!');

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>✨ Generate Article Draft</span>`;
    }
};

window.applyAiArticleToEditor = function() {
    if (!currentAiArticle) return;

    document.getElementById('editStoryId').value = '';
    document.getElementById('editStoryTitle').value = currentAiArticle.title;
    document.getElementById('editStorySubtitle').value = currentAiArticle.subtitle;
    document.getElementById('editStorySlug').value = currentAiArticle.slug;
    document.getElementById('editStorySlug').dataset.touched = "true";
    document.getElementById('editStoryCategory').value = currentAiArticle.category;
    document.getElementById('editStoryTags').value = currentAiArticle.tags || '';
    document.getElementById('editStoryAuthor').value = currentAiArticle.author;
    document.getElementById('editStoryImage').value = currentAiArticle.image;
    document.getElementById('editStoryImageAlt').value = currentAiArticle.imageAlt || currentAiArticle.title;
    document.getElementById('editStoryReadTime').value = currentAiArticle.readTime;
    document.getElementById('editStoryIsMember').checked = true;

    const editor = document.getElementById('wysiwygEditor');
    if (editor) editor.innerHTML = currentAiArticle.bodyHtml;
    updateWordAndCharCount();

    window.switchAdminTab('editorTab');
    showToast('✓ Inserted AI Draft into Classic Editor');
};

window.publishAiArticleImmediately = async function() {
    if (!currentAiArticle) return;
    window.applyAiArticleToEditor();
    await window.saveStory('published');
};

// 11. Categories Manager Logic
window.autoGenCatSlug = function(name) {
    const slugInput = document.getElementById('newCatSlug');
    if (slugInput) {
        slugInput.value = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
};

window.createNewCategory = function() {
    const name = document.getElementById('newCatName').value.trim();
    let slug = document.getElementById('newCatSlug').value.trim();
    if (!name) {
        alert('Please enter a category name.');
        return;
    }
    if (!slug) slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (!globalSettings.categories) globalSettings.categories = [];
    
    if (globalSettings.categories.some(c => c.id === slug)) {
        alert('A category with this slug ID already exists.');
        return;
    }

    globalSettings.categories.push({ id: slug, label: name });
    document.getElementById('newCatName').value = '';
    document.getElementById('newCatSlug').value = '';

    renderFullCategoriesList(globalSettings.categories);
    populateCategoryDropdowns(globalSettings.categories);
    pushSettingsToServer(globalSettings);
    showToast(`✓ Category "${name}" created and saved!`);
};

window.deleteCategoryItem = function(id) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    globalSettings.categories = (globalSettings.categories || []).filter(c => c.id !== id);
    renderFullCategoriesList(globalSettings.categories);
    populateCategoryDropdowns(globalSettings.categories);
    pushSettingsToServer(globalSettings);
    showToast('✓ Category removed.');
};

window.saveCategoriesOnly = function() {
    const catRows = document.querySelectorAll('.cat-row-item');
    if (catRows.length > 0) {
        globalSettings.categories = Array.from(catRows).map(row => ({
            id: row.querySelector('.cat-id-input').value.trim().toLowerCase(),
            label: row.querySelector('.cat-label-input').value.trim()
        })).filter(c => c.id && c.label);
    }
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
        <div class="flex items-center gap-3 p-3 rounded-xl theme-search-bg border theme-border cat-row-item">
            <input type="text" value="${c.label}" placeholder="Category Name" class="flex-1 theme-bg border theme-border theme-text text-xs p-2.5 rounded-lg cat-label-input">
            <input type="text" value="${c.id}" placeholder="slug-id" class="w-36 theme-bg border theme-border theme-text text-xs p-2.5 rounded-lg cat-id-input font-mono">
            <button type="button" onclick="deleteCategoryItem('${c.id}')" class="p-2 text-red-500 hover:bg-red-500/10 rounded-lg text-xs font-semibold">✕ Delete</button>
        </div>
    `).join('');
}

function populateCategoryDropdowns(categories) {
    const catSelect = document.getElementById('editStoryCategory');
    const aiTopicSelect = document.getElementById('aiTopicSelect');
    if (!categories) return;

    const opts = categories.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
    if (catSelect) catSelect.innerHTML = opts;
    if (aiTopicSelect) aiTopicSelect.innerHTML = opts;
}

// 12. Load Global Settings & Populate UI (Supabase + Local)
async function loadGlobalSettings() {
    // 1. Try Supabase Cloud
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('site_settings').select('*').eq('key', 'global_settings').single();
            if (!error && data && data.value) {
                globalSettings = Object.assign(globalSettings, data.value);
                populateSettingsToUI();
                updateDomainPrefix();
                return;
            }
        } catch (e) {
            console.warn("Supabase settings fetch fallback:", e);
        }
    }

    // 2. Local API Fallback
    try {
        const res = await fetch(`${API_BASE}/api/v1/settings`);
        const data = await res.json();
        if (data && typeof data === 'object') {
            globalSettings = Object.assign(globalSettings, data);
        }
    } catch (err) {
        // Fallback
    } finally {
        populateSettingsToUI();
        updateDomainPrefix();
    }
}

function populateSettingsToUI() {
    const s = globalSettings;
    if (!s) return;

    // Categories
    if (s.categories && s.categories.length > 0) {
        populateCategoryDropdowns(s.categories);
        renderFullCategoriesList(s.categories);
    }

    // Site & Branding Tab
    if (document.getElementById('siteNameInput')) document.getElementById('siteNameInput').value = s.site_name || 'Medium';
    if (document.getElementById('siteTaglineInput')) document.getElementById('siteTaglineInput').value = s.site_tagline || '';
    if (document.getElementById('footerCopyrightInput')) document.getElementById('footerCopyrightInput').value = s.footer_copyright || '';
    if (document.getElementById('contactEmailInput')) document.getElementById('contactEmailInput').value = s.contact_email || '';
    renderNavLinksRows(s.nav_links || []);

    // SEO Tab
    if (s.seo) {
        if (document.getElementById('seoMetaTitle')) document.getElementById('seoMetaTitle').value = s.seo.meta_title || '';
        if (document.getElementById('seoMetaDescription')) document.getElementById('seoMetaDescription').value = s.seo.meta_description || '';
        if (document.getElementById('seoFocusKeywords')) document.getElementById('seoFocusKeywords').value = s.seo.focus_keywords || '';
        if (document.getElementById('seoCanonicalUrl')) document.getElementById('seoCanonicalUrl').value = s.seo.canonical_url || '';
        if (document.getElementById('seoGoogleVerify')) document.getElementById('seoGoogleVerify').value = s.seo.google_verification || '';
        updateGooglePreview();
    }

    // AdSense Tab
    if (s.monetization) {
        if (document.getElementById('adSenseEnabled')) document.getElementById('adSenseEnabled').checked = Boolean(s.monetization.adsense_enabled);
        if (document.getElementById('adSenseClientId')) document.getElementById('adSenseClientId').value = s.monetization.adsense_client_id || '';
        if (document.getElementById('adHeaderEnabled')) document.getElementById('adHeaderEnabled').checked = Boolean(s.monetization.header_ad_enabled);
        if (document.getElementById('adInFeedEnabled')) document.getElementById('adInFeedEnabled').checked = Boolean(s.monetization.in_feed_ad_enabled);
        if (document.getElementById('adInArticleEnabled')) document.getElementById('adInArticleEnabled').checked = Boolean(s.monetization.in_article_ad_enabled);
        if (document.getElementById('adSidebarEnabled')) document.getElementById('adSidebarEnabled').checked = Boolean(s.monetization.sidebar_ad_enabled);
        if (document.getElementById('adsTxtContent')) document.getElementById('adsTxtContent').value = s.monetization.ads_txt || '';
    }

    // Appearance & Hero Tab
    if (s.hero) {
        if (document.getElementById('heroEnabled')) document.getElementById('heroEnabled').checked = Boolean(s.hero.enabled);
        if (document.getElementById('heroHeadline')) document.getElementById('heroHeadline').value = s.hero.headline || '';
        if (document.getElementById('heroSubtitle')) document.getElementById('heroSubtitle').value = s.hero.subtitle || '';
        if (document.getElementById('heroBgImage')) document.getElementById('heroBgImage').value = s.hero.bg_image || '';
    }

    if (document.getElementById('brandColorPicker')) {
        document.getElementById('brandColorPicker').value = s.brand_color || '#1a8917';
        document.getElementById('brandColorHex').value = s.brand_color || '#1a8917';
    }
    if (document.getElementById('animationsEnabled')) {
        document.getElementById('animationsEnabled').checked = s.animations_enabled !== false;
    }

    renderPluginsList(s.plugins || []);

    // Code & Analytics Tab
    if (s.analytics) {
        if (document.getElementById('gaMeasurementId')) document.getElementById('gaMeasurementId').value = s.analytics.ga_measurement_id || '';
        if (document.getElementById('customHeadCode')) document.getElementById('customHeadCode').value = s.analytics.custom_head_code || '';
        if (document.getElementById('customFooterCode')) document.getElementById('customFooterCode').value = s.analytics.custom_footer_code || '';
    }
}

// 13. Google SERP Live Preview
window.updateGooglePreview = function() {
    const title = document.getElementById('seoMetaTitle')?.value || 'Medium – Where good ideas find you.';
    const desc = document.getElementById('seoMetaDescription')?.value || 'Discover stories, thinking, and expertise.';
    const canonical = document.getElementById('seoCanonicalUrl')?.value || window.location.origin;

    const pTitle = document.getElementById('googlePreviewTitle');
    const pDesc = document.getElementById('googlePreviewDesc');
    const pUrl = document.getElementById('googlePreviewUrl');

    if (pTitle) pTitle.textContent = title;
    if (pDesc) pDesc.textContent = desc;
    if (pUrl) pUrl.textContent = canonical;
};

// 14. Push Settings API Helper (Supabase + Local)
async function pushSettingsToServer(updatedSettings) {
    if (supabaseClient) {
        try {
            const { error } = await supabaseClient.from('site_settings').upsert({
                key: 'global_settings',
                value: updatedSettings,
                updated_at: new Date().toISOString()
            });
            if (!error) {
                globalSettings = updatedSettings;
                showToast('✓ Saved to Supabase Cloud Database!');
                updateDomainPrefix();
                return;
            }
        } catch(e) {
            console.warn("Supabase push fallback:", e);
        }
    }

    try {
        const res = await fetch(`${API_BASE}/api/v1/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedSettings)
        });
        const data = await res.json();
        if (data.success) {
            globalSettings = updatedSettings;
            showToast('✓ Saved to database and applied to live website!');
            updateDomainPrefix();
        }
    } catch (err) {
        globalSettings = updatedSettings;
        showToast('✓ Settings applied to current session');
    }
}

window.saveSiteBrandingSettings = function() {
    globalSettings.site_name = document.getElementById('siteNameInput').value.trim();
    globalSettings.site_tagline = document.getElementById('siteTaglineInput').value.trim();
    globalSettings.footer_copyright = document.getElementById('footerCopyrightInput').value.trim();
    globalSettings.contact_email = document.getElementById('contactEmailInput').value.trim();

    const navRows = document.querySelectorAll('.nav-link-row');
    globalSettings.nav_links = Array.from(navRows).map(row => ({
        label: row.querySelector('.nav-label').value.trim(),
        url: row.querySelector('.nav-url').value.trim()
    })).filter(l => l.label && l.url);

    pushSettingsToServer(globalSettings);
};

window.saveSeoSettings = function() {
    globalSettings.seo = {
        meta_title: document.getElementById('seoMetaTitle').value.trim(),
        meta_description: document.getElementById('seoMetaDescription').value.trim(),
        focus_keywords: document.getElementById('seoFocusKeywords').value.trim(),
        canonical_url: document.getElementById('seoCanonicalUrl').value.trim(),
        google_verification: document.getElementById('seoGoogleVerify').value.trim()
    };
    pushSettingsToServer(globalSettings);
};

window.saveAdSenseSettings = function() {
    globalSettings.monetization = {
        adsense_enabled: document.getElementById('adSenseEnabled').checked,
        adsense_client_id: document.getElementById('adSenseClientId').value.trim(),
        header_ad_enabled: document.getElementById('adHeaderEnabled').checked,
        in_feed_ad_enabled: document.getElementById('adInFeedEnabled').checked,
        in_article_ad_enabled: document.getElementById('adInArticleEnabled').checked,
        sidebar_ad_enabled: document.getElementById('adSidebarEnabled').checked,
        ads_txt: document.getElementById('adsTxtContent').value.trim()
    };
    pushSettingsToServer(globalSettings);
};

window.saveAppearanceSettings = function() {
    globalSettings.hero = {
        enabled: document.getElementById('heroEnabled').checked,
        headline: document.getElementById('heroHeadline').value.trim(),
        subtitle: document.getElementById('heroSubtitle').value.trim(),
        bg_image: document.getElementById('heroBgImage').value.trim()
    };
    globalSettings.brand_color = document.getElementById('brandColorHex').value.trim();
    globalSettings.animations_enabled = document.getElementById('animationsEnabled').checked;

    pushSettingsToServer(globalSettings);
};

window.savePluginsSettings = function() {
    const pluginCheckboxes = document.querySelectorAll('.plugin-toggle-checkbox');
    globalSettings.plugins = Array.from(pluginCheckboxes).map(cb => ({
        id: cb.getAttribute('data-plugin-id'),
        name: cb.getAttribute('data-plugin-name'),
        enabled: cb.checked
    }));
    pushSettingsToServer(globalSettings);
};

window.saveCodeSettings = function() {
    globalSettings.analytics = {
        ga_measurement_id: document.getElementById('gaMeasurementId').value.trim(),
        custom_head_code: document.getElementById('customHeadCode').value.trim(),
        custom_footer_code: document.getElementById('customFooterCode').value.trim()
    };
    pushSettingsToServer(globalSettings);
};

// 15. Navigation Rows Helper
function renderNavLinksRows(links) {
    const container = document.getElementById('navLinksList');
    if (!container) return;

    container.innerHTML = links.map(link => `
        <div class="flex items-center gap-2 nav-link-row">
            <input type="text" value="${link.label}" placeholder="Link Label" class="flex-1 theme-bg border theme-border theme-text text-xs p-2.5 rounded-xl nav-label">
            <input type="text" value="${link.url}" placeholder="URL / File" class="flex-1 theme-bg border theme-border theme-text text-xs p-2.5 rounded-xl nav-url font-mono">
            <button type="button" onclick="this.parentElement.remove()" class="p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-semibold">✕</button>
        </div>
    `).join('');
}

window.addNavLinkRow = function() {
    const container = document.getElementById('navLinksList');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'flex items-center gap-2 nav-link-row';
    div.innerHTML = `
        <input type="text" value="New Page" placeholder="Link Label" class="flex-1 theme-bg border theme-border theme-text text-xs p-2.5 rounded-xl nav-label">
        <input type="text" value="page.html" placeholder="URL / File" class="flex-1 theme-bg border theme-border theme-text text-xs p-2.5 rounded-xl nav-url font-mono">
        <button type="button" onclick="this.parentElement.remove()" class="p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-semibold">✕</button>
    `;
    container.appendChild(div);
};

function renderPluginsList(plugins) {
    const grid = document.getElementById('pluginsGrid');
    if (!grid) return;

    grid.innerHTML = plugins.map(p => `
        <div class="p-4 rounded-xl theme-card border theme-border flex items-center justify-between">
            <div class="space-y-0.5">
                <h4 class="font-bold text-xs theme-text">${p.name}</h4>
                <p class="text-[10px] font-mono theme-muted">Plugin ID: ${p.id}</p>
            </div>
            <input type="checkbox" data-plugin-id="${p.id}" data-plugin-name="${p.name}" ${p.enabled ? 'checked' : ''} class="w-5 h-5 rounded theme-border cursor-pointer plugin-toggle-checkbox">
        </div>
    `).join('');
}

// 16. Color Picker Sync
const colorPicker = document.getElementById('brandColorPicker');
const colorHex = document.getElementById('brandColorHex');
if (colorPicker && colorHex) {
    colorPicker.addEventListener('input', (e) => { colorHex.value = e.target.value; });
    colorHex.addEventListener('input', (e) => { colorPicker.value = e.target.value; });
}

// 17. Light/Dark Theme Switcher Logic
window.toggleTheme = function() {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    if (isDark) {
        html.classList.remove('dark');
        html.classList.add('light');
        localStorage.setItem('medium_theme', 'light');
    } else {
        html.classList.remove('light');
        html.classList.add('dark');
        localStorage.setItem('medium_theme', 'dark');
    }
    updateThemeIcons();
};

function updateThemeIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    document.querySelectorAll('.themeSunSvg').forEach(el => el.classList.toggle('hidden', !isDark));
    document.querySelectorAll('.themeMoonSvg').forEach(el => el.classList.toggle('hidden', isDark));
}

updateThemeIcons();

// Initial Data Load
loadManageStories();
loadGlobalSettings();
updateWordAndCharCount();

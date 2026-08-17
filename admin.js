// ================================================================
// MEDIUM CMS STUDIO PRO ENGINE (FULL FEATURES + WEBP STUDIO)
// ================================================================

let allAdminStories = [];
let isHtmlMode = false;
let currentCompressedDataUrl = null;
let currentCompressedFile = null;
let currentStandaloneDataUrl = null;
let currentStandaloneFile = null;

const defaultGoogleServiceAccount = {
  "type": "service_account",
  "project_id": "yt-music-505216",
  "private_key_id": "",
  "private_key": "",
  "client_email": "aman-249@yt-music-505216.iam.gserviceaccount.com",
  "client_id": "115525574626613689822",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
};

let globalSettings = {
    site_name: "Medium",
    site_tagline: "Where good ideas find you.",
    footer_copyright: "© 2026 Medium. All rights reserved.",
    brand_color: "#1a8917",
    categories: [],
    seo: {
        meta_title: "Medium – Where good ideas find you.",
        meta_description: "Discover stories, thinking, and expertise.",
        canonical_url: "https://hivecloud.in/"
    },
    indexing: {
        service_account_json: JSON.stringify(defaultGoogleServiceAccount, null, 2),
        auto_index_on_publish: true,
        indexnow_key: "e0f7a934bd824d5598ba9622d715ac90"
    },
    plugins: {
        ga_measurement_id: "",
        gsc_verification: "",
        custom_head_code: "",
        custom_footer_code: ""
    },
    social: {},
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
    const tabs = ['editorTab', 'imageStudioTab', 'storiesTab', 'categoryTab', 'supabaseTab', 'siteTab', 'seoTab', 'socialTab', 'pluginsTab', 'indexingTab', 'adsTab'];
    
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
// 7. HIGH-PRECISION 5-STEP WEBP COMPRESSION ENGINE
// ================================================================

let featuredPendingFile = null;
let featuredCompressedResult = null;

async function compressImageToWebpPrecise(file, targetKb = 30) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
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
            img.onerror = () => reject(new Error('Failed to decode image file'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file from storage'));
        reader.readAsDataURL(file);
    });
}

// 5-Step Featured Image WebP Studio Handlers
window.syncFeaturedKb = function(val) {
    const num = parseInt(val, 10) || 30;
    const slider = document.getElementById('featuredKbSlider');
    const input = document.getElementById('featuredKbInput');
    const display = document.getElementById('featuredKbDisplay');
    const targetLabel = document.getElementById('featuredTargetLabel');
    const compressLabel = document.getElementById('featuredCompressTargetLabel');
    if (slider) slider.value = num;
    if (input) input.value = num;
    if (display) display.textContent = `${num} KB`;
    if (targetLabel) targetLabel.textContent = `Target: ${num} KB`;
    if (compressLabel) compressLabel.textContent = `${num} KB`;
};

window.onFeaturedFileSelected = function(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    featuredPendingFile = file;
    featuredCompressedResult = null;
    const origKb = Math.round(file.size / 1024);
    const sizeStr = origKb > 1024 ? `${(origKb / 1024).toFixed(2)} MB` : `${origKb} KB`;

    const sizeEl = document.getElementById('featuredOriginalSizeText');
    const previewRow = document.getElementById('featuredPreviewRow');

    if (sizeEl) sizeEl.textContent = `${file.name} (${sizeStr})`;
    if (previewRow) previewRow.classList.add('hidden');

    showToast(`✓ Cover image selected: ${file.name} (${sizeStr})`);
};

window.executeFeaturedCompression = async function() {
    if (!featuredPendingFile) {
        alert('Please select a cover image file first.');
        return;
    }

    const btn = document.getElementById('featuredCompressBtn');
    const targetKb = parseInt(document.getElementById('featuredKbInput')?.value || '30', 10);

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span>⏳ Compressing to WebP (${targetKb} KB)...</span>`;
    }

    try {
        const result = await compressImageToWebpPrecise(featuredPendingFile, targetKb);
        featuredCompressedResult = result;

        const thumb = document.getElementById('featuredCompressedThumb');
        const finalSizeText = document.getElementById('featuredFinalSizeText');
        const savingsText = document.getElementById('featuredSavingsText');
        const previewRow = document.getElementById('featuredPreviewRow');

        if (thumb) thumb.src = result.dataUrl;
        if (finalSizeText) finalSizeText.innerHTML = `Final: <strong>${result.sizeKb} KB</strong> (Target: ${targetKb} KB)`;
        if (savingsText) savingsText.textContent = `Original: ${result.originalKb} KB → ${result.savingsPct}% saved`;
        if (previewRow) previewRow.classList.remove('hidden');

        showToast(`✓ Converted to ${result.sizeKb} KB WebP! Click 'Upload / Set Cover Image' to apply.`);
    } catch (err) {
        console.error(err);
        alert('WebP compression failed: ' + err.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `⚡ Convert to WebP (<span id="featuredCompressTargetLabel">${targetKb} KB</span>)`;
        }
    }
};

window.executeFeaturedUpload = async function() {
    if (!featuredPendingFile && !featuredCompressedResult) {
        alert('Please select a cover image file first.');
        return;
    }

    const targetKb = parseInt(document.getElementById('featuredKbInput')?.value || '30', 10);
    const uploadBtn = document.getElementById('featuredUploadBtn');

    // If not compressed yet, compress automatically now
    if (!featuredCompressedResult && featuredPendingFile) {
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = `<span>⏳ Converting & Uploading...</span>`;
        }
        try {
            featuredCompressedResult = await compressImageToWebpPrecise(featuredPendingFile, targetKb);
            const thumb = document.getElementById('featuredCompressedThumb');
            const finalSizeText = document.getElementById('featuredFinalSizeText');
            const savingsText = document.getElementById('featuredSavingsText');
            const previewRow = document.getElementById('featuredPreviewRow');

            if (thumb) thumb.src = featuredCompressedResult.dataUrl;
            if (finalSizeText) finalSizeText.innerHTML = `Final: <strong>${featuredCompressedResult.sizeKb} KB</strong> (Target: ${targetKb} KB)`;
            if (savingsText) savingsText.textContent = `Original: ${featuredCompressedResult.originalKb} KB → ${featuredCompressedResult.savingsPct}% saved`;
            if (previewRow) previewRow.classList.remove('hidden');
        } catch (err) {
            console.error(err);
            alert('Failed to compress cover image: ' + err.message);
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = `🌟 Upload / Set Cover Image`;
            }
            return;
        } finally {
            if (uploadBtn) uploadBtn.disabled = false;
        }
    }

    if (!featuredCompressedResult) return;

    // Apply to cover image field and preview
    const imgInput = document.getElementById('editStoryImage');
    if (imgInput) {
        imgInput.value = featuredCompressedResult.dataUrl;
        imgInput.dispatchEvent(new Event('input'));
    }
    window.updateCoverPreview(featuredCompressedResult.dataUrl);

    // Visual button feedback
    if (uploadBtn) {
        uploadBtn.innerHTML = '✅ Cover Image Set!';
        uploadBtn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
        uploadBtn.classList.add('bg-zinc-900', 'dark:bg-zinc-100', 'text-white', 'dark:text-zinc-900');
        setTimeout(() => {
            uploadBtn.innerHTML = '🌟 Upload / Set Cover Image';
            uploadBtn.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
            uploadBtn.classList.remove('bg-zinc-900', 'dark:bg-zinc-100', 'text-white', 'dark:text-zinc-900');
        }, 2500);
    }

    showToast(`✓ WebP (${featuredCompressedResult.sizeKb} KB) uploaded & attached as cover!`);
};

// ================================================================
// 8. EDITOR IMAGE UPLOAD SYSTEM (Separate from Cover Image)
// ================================================================
let editorPendingFile = null;
let editorCompressedResult = null;

window.toggleEditorImageUpload = function() {
    const panel = document.getElementById('editorImageUploadPanel');
    if (panel) {
        panel.classList.toggle('hidden');
        const isOpened = !panel.classList.contains('hidden');
        const toggleBtn = document.getElementById('editorImageToggleBtn');
        if (toggleBtn) {
            if (isOpened) {
                toggleBtn.classList.add('ring-2', 'ring-purple-400');
            } else {
                toggleBtn.classList.remove('ring-2', 'ring-purple-400');
            }
        }
    }
};

window.syncEditorKb = function(val) {
    const num = parseInt(val, 10) || 40;
    const slider = document.getElementById('editorKbSlider');
    const input = document.getElementById('editorKbInput');
    const targetLabel = document.getElementById('editorTargetLabel');
    const convertLabel = document.getElementById('editorConvertTargetLabel');
    if (slider) slider.value = num;
    if (input) input.value = num;
    if (targetLabel) targetLabel.textContent = `Target: ${num} KB`;
    if (convertLabel) convertLabel.textContent = `${num} KB`;
};

window.onEditorImageSelected = function(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    editorPendingFile = file;
    editorCompressedResult = null;
    const origKb = Math.round(file.size / 1024);
    const sizeStr = origKb > 1024 ? `${(origKb / 1024).toFixed(2)} MB` : `${origKb} KB`;

    const nameEl = document.getElementById('editorSelectedFileName');
    const previewSection = document.getElementById('editorConvertedPreview');

    if (nameEl) nameEl.textContent = `${file.name} (${sizeStr})`;
    if (previewSection) previewSection.classList.add('hidden');

    showToast(`✓ Article image selected: ${file.name}`);
};

window.executeEditorImageConvert = async function() {
    if (!editorPendingFile) {
        alert('Please select an article image file first.');
        return;
    }

    const btn = document.getElementById('editorConvertBtn');
    const targetKb = parseInt(document.getElementById('editorKbInput')?.value || '40', 10);

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span>⏳ Converting (${targetKb} KB)...</span>`;
    }

    try {
        const result = await compressImageToWebpPrecise(editorPendingFile, targetKb);
        editorCompressedResult = result;

        const thumb = document.getElementById('editorConvertedThumb');
        const sizeEl = document.getElementById('editorConvertedSize');
        const savingsEl = document.getElementById('editorConvertedSavings');
        const previewSection = document.getElementById('editorConvertedPreview');

        if (thumb) thumb.src = result.dataUrl;
        if (sizeEl) sizeEl.innerHTML = `Final: <strong>${result.sizeKb} KB</strong> (Target: ${targetKb} KB)`;
        if (savingsEl) savingsEl.textContent = `Original: ${result.originalKb} KB → ${result.savingsPct}% saved`;
        if (previewSection) previewSection.classList.remove('hidden');

        showToast(`✓ Converted to ${result.sizeKb} KB WebP! Click 'Insert WebP into Article'.`);
    } catch (err) {
        console.error(err);
        alert('WebP conversion failed: ' + err.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `⚡ Convert to WebP (<span id="editorConvertTargetLabel">${targetKb} KB</span>)`;
        }
    }
};

window.executeEditorImageInsert = async function() {
    if (!editorPendingFile && !editorCompressedResult) {
        alert('Please select an image file first.');
        return;
    }

    const targetKb = parseInt(document.getElementById('editorKbInput')?.value || '40', 10);
    const insertBtn = document.getElementById('editorInsertBtn');

    // If not compressed yet, compress automatically now
    if (!editorCompressedResult && editorPendingFile) {
        if (insertBtn) {
            insertBtn.disabled = true;
            insertBtn.innerHTML = `<span>⏳ Converting & Inserting...</span>`;
        }
        try {
            editorCompressedResult = await compressImageToWebpPrecise(editorPendingFile, targetKb);
            const thumb = document.getElementById('editorConvertedThumb');
            const sizeEl = document.getElementById('editorConvertedSize');
            const savingsEl = document.getElementById('editorConvertedSavings');
            const previewSection = document.getElementById('editorConvertedPreview');

            if (thumb) thumb.src = editorCompressedResult.dataUrl;
            if (sizeEl) sizeEl.innerHTML = `Final: <strong>${editorCompressedResult.sizeKb} KB</strong>`;
            if (savingsEl) savingsEl.textContent = `${editorCompressedResult.originalKb} KB → ${editorCompressedResult.savingsPct}% saved`;
            if (previewSection) previewSection.classList.remove('hidden');
        } catch (err) {
            console.error(err);
            alert('Failed to compress image: ' + err.message);
            if (insertBtn) {
                insertBtn.disabled = false;
                insertBtn.innerHTML = `📝 Insert WebP into Article`;
            }
            return;
        } finally {
            if (insertBtn) insertBtn.disabled = false;
        }
    }

    if (!editorCompressedResult) return;

    const imgHtml = `<figure class="my-6 space-y-2"><img src="${editorCompressedResult.dataUrl}" alt="${editorCompressedResult.defaultName}" class="w-full rounded-xl border theme-border object-cover shadow-sm"><figcaption class="text-center text-xs theme-muted">${editorCompressedResult.defaultName}</figcaption></figure><p><br></p>`;

    if (isHtmlMode) {
        const raw = document.getElementById('rawHtmlEditor');
        if (raw) raw.value += imgHtml;
    } else {
        const editor = document.getElementById('wysiwygEditor');
        if (editor) {
            editor.focus();
            document.execCommand('insertHTML', false, imgHtml);
        }
    }
    updateWordAndCharCount();

    // Visual button feedback
    if (insertBtn) {
        insertBtn.innerHTML = '✅ Inserted into Article!';
        setTimeout(() => {
            insertBtn.innerHTML = '📝 Insert WebP into Article';
        }, 2500);
    }

    showToast(`✓ WebP (${editorCompressedResult.sizeKb} KB) inserted into article body!`);
};
window.setStandaloneTargetKb = function(kb) {
    const input = document.getElementById('standaloneCustomKbInput');
    if (input) {
        input.value = kb;
        if (currentStandaloneFile) recompressStandaloneImage();
    }
};

window.handleStandaloneImageUpload = async function(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    currentStandaloneFile = file;

    const label = document.getElementById('standaloneFileLabel');
    if (label) label.textContent = `Selected: ${file.name} (${Math.round(file.size/1024)} KB)`;

    await recompressStandaloneImage();
};

window.recompressStandaloneImage = async function() {
    if (!currentStandaloneFile) {
        alert('Please select an image file first.');
        return;
    }

    const targetKb = parseInt(document.getElementById('standaloneCustomKbInput').value, 10) || 100;

    try {
        const res = await compressImageToWebpPrecise(currentStandaloneFile, targetKb);
        currentStandaloneDataUrl = res.dataUrl;

        document.getElementById('standaloneEmptyMsg').classList.add('hidden');
        document.getElementById('standaloneActiveResult').classList.remove('hidden');

        document.getElementById('standalonePreviewImg').src = res.dataUrl;
        document.getElementById('resOrigSize').textContent = `${res.originalKb} KB`;
        document.getElementById('resCompSize').textContent = `${res.sizeKb} KB`;
        document.getElementById('resSavings').textContent = `${res.savingsPct}%`;
        showToast(`✓ Converted to WebP (${res.sizeKb} KB)`);
    } catch (err) {
        console.error(err);
        showToast('✕ Conversion failed: ' + err.message);
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
            if (status === 'published' && (!globalSettings.indexing || globalSettings.indexing.auto_index_on_publish !== false)) {
                triggerAutoIndex(`https://hivecloud.in/${slug}`);
            }
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

// ================================================================
// 12. SETTINGS MANAGEMENT (Site Branding, SEO, Social, Plugins, Ads)
// ================================================================

window.saveSiteBrandingSettings = function() {
    globalSettings.site_name = document.getElementById('siteNameInput').value.trim() || 'Medium';
    globalSettings.site_tagline = document.getElementById('siteTaglineInput').value.trim();
    globalSettings.favicon_url = document.getElementById('faviconUrlInput').value.trim();
    globalSettings.og_image_url = document.getElementById('ogImageUrlInput').value.trim();
    globalSettings.brand_color = document.getElementById('brandColorInput').value.trim() || "#1a8917";
    globalSettings.footer_copyright = document.getElementById('footerCopyrightInput').value.trim();
    pushSettingsToServer(globalSettings);
};

window.saveSeoSettings = function() {
    if (!globalSettings.seo) globalSettings.seo = {};
    globalSettings.seo.meta_title = document.getElementById('seoTitleInput').value.trim();
    globalSettings.seo.meta_description = document.getElementById('seoDescInput').value.trim();
    globalSettings.seo.meta_keywords = document.getElementById('seoKeywordsInput').value.trim();
    globalSettings.seo.canonical_url = document.getElementById('seoCanonicalInput').value.trim();
    globalSettings.seo.robots = document.getElementById('seoRobotsInput').value;
    pushSettingsToServer(globalSettings);
};

window.saveSocialSettings = function() {
    if (!globalSettings.social) globalSettings.social = {};
    globalSettings.social.twitter = document.getElementById('socialTwitterInput').value.trim();
    globalSettings.social.github = document.getElementById('socialGithubInput').value.trim();
    globalSettings.social.linkedin = document.getElementById('socialLinkedinInput').value.trim();
    globalSettings.social.youtube = document.getElementById('socialYoutubeInput').value.trim();
    globalSettings.social.instagram = document.getElementById('socialInstagramInput').value.trim();
    globalSettings.social.facebook = document.getElementById('socialFacebookInput').value.trim();
    pushSettingsToServer(globalSettings);
};

window.savePluginsSettings = function() {
    if (!globalSettings.plugins) globalSettings.plugins = {};
    globalSettings.plugins.ga_measurement_id = document.getElementById('pluginGaIdInput').value.trim();
    globalSettings.plugins.gsc_verification = document.getElementById('pluginGscInput').value.trim();
    globalSettings.plugins.custom_head_code = document.getElementById('pluginCustomHeadInput').value.trim();
    globalSettings.plugins.custom_footer_code = document.getElementById('pluginCustomFooterInput').value.trim();
    pushSettingsToServer(globalSettings);
};

window.saveIndexingSettings = function() {
    if (!globalSettings.indexing) globalSettings.indexing = {};
    const saText = document.getElementById('indexingServiceAccountJson').value.trim();
    if (saText) {
        try {
            JSON.parse(saText);
            globalSettings.indexing.service_account_json = saText;
        } catch (e) {
            alert('Invalid JSON format in Service Account Key box.');
            return;
        }
    }
    globalSettings.indexing.auto_index_on_publish = document.getElementById('autoIndexOnPublishToggle').checked;
    globalSettings.indexing.indexnow_key = document.getElementById('indexingIndexNowKey').value.trim() || 'e0f7a934bd824d5598ba9622d715ac90';
    pushSettingsToServer(globalSettings);
    appendIndexingLog('SETTINGS', 'Local Config', 'Indexing settings saved successfully.', 'System');
};

window.copyServiceAccountEmail = function() {
    let email = 'aman-249@yt-music-505216.iam.gserviceaccount.com';
    try {
        if (globalSettings.indexing && globalSettings.indexing.service_account_json) {
            const parsed = JSON.parse(globalSettings.indexing.service_account_json);
            if (parsed.client_email) email = parsed.client_email;
        }
    } catch(e) {}
    navigator.clipboard.writeText(email).then(() => {
        showToast('✓ Service Account email copied to clipboard!');
    });
};

window.clearIndexingLog = function() {
    const container = document.getElementById('indexingLogContainer');
    if (container) container.innerHTML = `<p class="text-zinc-500">// Log cleared. Ready for next indexing push...</p>`;
};

function appendIndexingLog(status, url, message, engine = 'Google') {
    const container = document.getElementById('indexingLogContainer');
    if (!container) return;

    const time = new Date().toLocaleTimeString();
    let statusClass = 'text-emerald-400 border-emerald-800 bg-emerald-950/40';
    if (status === 403 || status === 'PERMISSION_DENIED') statusClass = 'text-amber-400 border-amber-800 bg-amber-950/40';
    if (status === 500 || status === 'ERROR') statusClass = 'text-red-400 border-red-800 bg-red-950/40';
    if (status === 'SETTINGS') statusClass = 'text-blue-400 border-blue-800 bg-blue-950/40';

    const card = document.createElement('div');
    card.className = `p-3 rounded-lg border text-xs space-y-1 mb-2 ${statusClass}`;
    card.innerHTML = `
        <div class="flex items-center justify-between flex-wrap gap-2">
            <span class="font-bold font-mono">[${engine}] ${status}</span>
            <span class="text-[10px] text-zinc-400 font-mono">${time}</span>
        </div>
        <div class="text-[11px] font-mono break-all text-zinc-200">${url}</div>
        <div class="text-[11px] text-zinc-400 font-sans leading-relaxed">${message}</div>
    `;

    if (container.children.length === 1 && container.children[0].tagName === 'P') {
        container.innerHTML = '';
    }
    container.prepend(card);
}

window.submitSingleUrlIndexing = async function() {
    const urlInput = document.getElementById('manualIndexUrlInput');
    const targetUrl = (urlInput ? urlInput.value.trim() : '') || 'https://hivecloud.in/agentic-ai-coding-guide-2026';
    const actionType = document.getElementById('manualIndexActionType').value || 'URL_UPDATED';
    const engine = document.getElementById('manualIndexEngine').value || 'both';
    const btn = document.getElementById('btnSingleIndex');

    if (!targetUrl.startsWith('http')) {
        alert('Please enter a valid absolute URL (e.g. https://hivecloud.in/...)');
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="animate-spin">⏳</span> Pushing to Googlebot...`;
    }

    try {
        let saJson = null;
        if (globalSettings.indexing && globalSettings.indexing.service_account_json) {
            saJson = globalSettings.indexing.service_account_json;
        } else {
            saJson = JSON.stringify(defaultGoogleServiceAccount);
        }

        const res = await fetch('/api/index-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: targetUrl,
                type: actionType,
                engine: engine,
                serviceAccount: saJson
            })
        });

        const data = await res.json();
        if (data.success && data.results) {
            if (data.results.google && data.results.google.length > 0) {
                data.results.google.forEach(g => {
                    if (g.status === 200) {
                        appendIndexingLog('200 OK', g.url, '✓ Googlebot notified successfully. Crawler dispatched.', 'Google');
                        showToast(`✓ Googlebot successfully notified for ${targetUrl.slice(0, 35)}...`);
                    } else if (g.status === 403) {
                        appendIndexingLog('403 PERMISSION_DENIED', g.url, '⚠️ Add aman-249@yt-music-505216.iam.gserviceaccount.com as Owner in Search Console -> Settings -> Users.', 'Google');
                        showToast('⚠️ Google 403: Add service account email as Owner in Search Console.');
                    } else {
                        appendIndexingLog(g.status || 'ERROR', g.url, JSON.stringify(g.response || g.error), 'Google');
                    }
                });
            }
            if (data.results.indexNow) {
                appendIndexingLog(data.results.indexNow.status || '200', targetUrl, data.results.indexNow.message || 'Submitted to Bing & Yandex', 'IndexNow');
            }
        } else {
            appendIndexingLog('ERROR', targetUrl, data.error || 'Server error', 'API');
            alert('Indexing Error: ' + (data.error || 'Check log terminal below'));
        }
    } catch (err) {
        appendIndexingLog('EXCEPTION', targetUrl, err.message, 'Network');
        alert('Network Error: ' + err.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<span>🚀 Push to Googlebot Now</span>`;
        }
    }
};

window.submitBatchIndexing = async function() {
    const btn = document.getElementById('btnBatchIndex');
    const urlsToSubmit = [
        'https://hivecloud.in/agentic-ai-coding-guide-2026',
        'https://hivecloud.in/ai-reasoning-test-time-compute',
        'https://hivecloud.in/autonomous-ai-agents-production-guide',
        'https://hivecloud.in/multi-agent-orchestration-mcp-guide',
        'https://hivecloud.in/context-engineering-dynamic-memory-guide'
    ];

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="animate-spin">⏳</span> Submitting 5 URLs...`;
    }

    try {
        let saJson = null;
        if (globalSettings.indexing && globalSettings.indexing.service_account_json) {
            saJson = globalSettings.indexing.service_account_json;
        } else {
            saJson = JSON.stringify(defaultGoogleServiceAccount);
        }

        const res = await fetch('/api/index-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                urls: urlsToSubmit,
                type: 'URL_UPDATED',
                engine: 'both',
                serviceAccount: saJson
            })
        });

        const data = await res.json();
        if (data.success && data.results) {
            if (data.results.google && data.results.google.length > 0) {
                data.results.google.forEach(g => {
                    if (g.status === 200) {
                        appendIndexingLog('200 OK', g.url, '✓ Googlebot notified successfully.', 'Google');
                    } else if (g.status === 403) {
                        appendIndexingLog('403 PERMISSION_DENIED', g.url, '⚠️ Add aman-249@yt-music-505216.iam.gserviceaccount.com as Owner in Search Console.', 'Google');
                    } else {
                        appendIndexingLog(g.status || 'ERROR', g.url, JSON.stringify(g.response || g.error), 'Google');
                    }
                });
            }
            if (data.results.indexNow) {
                appendIndexingLog(data.results.indexNow.status || '200', 'Batch (5 URLs)', data.results.indexNow.message || 'Batch submitted to Bing/Yandex', 'IndexNow');
            }
            showToast(`✓ Processed batch indexing for ${urlsToSubmit.length} URLs!`);
        } else {
            appendIndexingLog('ERROR', 'Batch', data.error || 'Server error', 'API');
        }
    } catch (err) {
        appendIndexingLog('EXCEPTION', 'Batch', err.message, 'Network');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<span>⚡ Index All 5 Stories Now</span>`;
        }
    }
};

async function triggerAutoIndex(url) {
    try {
        let saJson = null;
        if (globalSettings.indexing && globalSettings.indexing.service_account_json) {
            saJson = globalSettings.indexing.service_account_json;
        } else {
            saJson = JSON.stringify(defaultGoogleServiceAccount);
        }

        fetch('/api/index-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: url,
                type: 'URL_UPDATED',
                engine: 'both',
                serviceAccount: saJson
            })
        }).then(r => r.json()).then(d => {
            if (d.success) {
                showToast(`🚀 Google & Bing notified for new story: ${url.slice(0, 30)}...`);
            }
        }).catch(e => {});
    } catch(e) {}
}

window.saveAdsSettings = function() {
    if (!globalSettings.monetization) globalSettings.monetization = {};
    globalSettings.monetization.adsense_client_id = document.getElementById('adsenseClientIdInput').value.trim();
    globalSettings.monetization.ads_txt = document.getElementById('adsTxtInput').value.trim();
    pushSettingsToServer(globalSettings);
};

async function pushSettingsToServer(settings) {
    // 0ms Instant local cache update
    localStorage.setItem('cached_settings', JSON.stringify(settings));

    const client = window.supabaseClient;
    if (client) {
        try {
            await client.from('site_settings').upsert([{
                key: 'global_settings',
                value: settings,
                updated_at: new Date().toISOString()
            }], { onConflict: 'key' });
            showToast('✓ Settings synchronized & saved instantly!');
            return;
        } catch(e) {
            console.error("Supabase sync error:", e);
        }
    }
    showToast('✓ Settings saved locally to browser cache!');
}

async function loadGlobalSettings() {
    // 1. Instant cache load
    try {
        const cached = localStorage.getItem('cached_settings');
        if (cached) {
            globalSettings = Object.assign(globalSettings, JSON.parse(cached));
            populateSettingsToUI();
        }
    } catch(e) {}

    // 2. Background sync with Supabase
    const client = window.supabaseClient;
    if (client) {
        try {
            const { data, error } = await client.from('site_settings').select('*').eq('key', 'global_settings').single();
            if (!error && data && data.value) {
                const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
                globalSettings = Object.assign(globalSettings, parsed);
                localStorage.setItem('cached_settings', JSON.stringify(globalSettings));
                populateSettingsToUI();
            }
        } catch(e) {}
    }
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
    if (document.getElementById('faviconUrlInput')) {
        document.getElementById('faviconUrlInput').value = globalSettings.favicon_url || '';
    }
    if (document.getElementById('ogImageUrlInput')) {
        document.getElementById('ogImageUrlInput').value = globalSettings.og_image_url || '';
    }
    if (document.getElementById('brandColorInput')) {
        document.getElementById('brandColorInput').value = globalSettings.brand_color || '#1a8917';
        if (document.getElementById('brandColorPicker')) {
            document.getElementById('brandColorPicker').value = globalSettings.brand_color || '#1a8917';
        }
    }
    if (document.getElementById('footerCopyrightInput')) {
        document.getElementById('footerCopyrightInput').value = globalSettings.footer_copyright || '';
    }

    // SEO
    if (globalSettings.seo) {
        if (document.getElementById('seoTitleInput')) document.getElementById('seoTitleInput').value = globalSettings.seo.meta_title || '';
        if (document.getElementById('seoDescInput')) document.getElementById('seoDescInput').value = globalSettings.seo.meta_description || '';
        if (document.getElementById('seoKeywordsInput')) document.getElementById('seoKeywordsInput').value = globalSettings.seo.meta_keywords || '';
        if (document.getElementById('seoCanonicalInput')) document.getElementById('seoCanonicalInput').value = globalSettings.seo.canonical_url || '';
        if (document.getElementById('seoRobotsInput')) document.getElementById('seoRobotsInput').value = globalSettings.seo.robots || 'index, follow';
    }

    // Social
    if (globalSettings.social) {
        if (document.getElementById('socialTwitterInput')) document.getElementById('socialTwitterInput').value = globalSettings.social.twitter || '';
        if (document.getElementById('socialGithubInput')) document.getElementById('socialGithubInput').value = globalSettings.social.github || '';
        if (document.getElementById('socialLinkedinInput')) document.getElementById('socialLinkedinInput').value = globalSettings.social.linkedin || '';
        if (document.getElementById('socialYoutubeInput')) document.getElementById('socialYoutubeInput').value = globalSettings.social.youtube || '';
        if (document.getElementById('socialInstagramInput')) document.getElementById('socialInstagramInput').value = globalSettings.social.instagram || '';
        if (document.getElementById('socialFacebookInput')) document.getElementById('socialFacebookInput').value = globalSettings.social.facebook || '';
    }

    // Plugins & Analytics
    if (globalSettings.plugins) {
        if (document.getElementById('pluginGaIdInput')) document.getElementById('pluginGaIdInput').value = globalSettings.plugins.ga_measurement_id || '';
        if (document.getElementById('pluginGscInput')) document.getElementById('pluginGscInput').value = globalSettings.plugins.gsc_verification || '';
        if (document.getElementById('pluginCustomHeadInput')) document.getElementById('pluginCustomHeadInput').value = globalSettings.plugins.custom_head_code || '';
        if (document.getElementById('pluginCustomFooterInput')) document.getElementById('pluginCustomFooterInput').value = globalSettings.plugins.custom_footer_code || '';
    }

    // Indexing Plugin
    if (globalSettings.indexing) {
        if (document.getElementById('indexingServiceAccountJson')) {
            document.getElementById('indexingServiceAccountJson').value = globalSettings.indexing.service_account_json || JSON.stringify(defaultGoogleServiceAccount, null, 2);
        }
        if (document.getElementById('autoIndexOnPublishToggle')) {
            document.getElementById('autoIndexOnPublishToggle').checked = globalSettings.indexing.auto_index_on_publish !== false;
        }
        if (document.getElementById('indexingIndexNowKey')) {
            document.getElementById('indexingIndexNowKey').value = globalSettings.indexing.indexnow_key || 'e0f7a934bd824d5598ba9622d715ac90';
        }
    } else {
        if (document.getElementById('indexingServiceAccountJson')) {
            document.getElementById('indexingServiceAccountJson').value = JSON.stringify(defaultGoogleServiceAccount, null, 2);
        }
    }

    // Monetization
    if (globalSettings.monetization) {
        if (document.getElementById('adsenseClientIdInput')) document.getElementById('adsenseClientIdInput').value = globalSettings.monetization.adsense_client_id || '';
        if (document.getElementById('adsTxtInput')) document.getElementById('adsTxtInput').value = globalSettings.monetization.ads_txt || '';
    }

    renderFullCategoriesList(globalSettings.categories || []);
    populateCategoryDropdowns(globalSettings.categories || []);
}

// Initial Load
loadGlobalSettings();
loadManageStories();
window.switchAdminTab('editorTab');


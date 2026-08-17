// ================================================================
// MEDIUM CORE HOMEPAGE ENGINE (PRISTINE & 100% DYNAMIC)
// ================================================================

let globalSettings = {};
let mediumStories = [];
let activeTopic = 'all';

// 1. Reading Progress Bar
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrollPos = window.scrollY;
            const progress = docHeight > 0 ? (scrollPos / docHeight) * 100 : 0;
            const bar = document.getElementById('scrollProgress');
            if (bar) bar.style.width = `${progress}%`;
            ticking = false;
        });
        ticking = true;
    }
}, { passive: true });

// 2. Light / Dark Theme Switcher
window.toggleTheme = function() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcons();
};

function updateThemeIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    document.querySelectorAll('.themeSunSvg').forEach(el => el.classList.toggle('hidden', !isDark));
    document.querySelectorAll('.themeMoonSvg').forEach(el => el.classList.toggle('hidden', isDark));
    const badge = document.getElementById('currentThemeBadge');
    if (badge) badge.textContent = isDark ? 'Dark' : 'Light';
}

updateThemeIcons();

// 3. Mobile Navigation Drawer
window.openMobileDrawer = function() {
    const d = document.getElementById('mobileDrawer');
    if (d) d.style.display = 'flex';
};

window.closeMobileDrawer = function() {
    const d = document.getElementById('mobileDrawer');
    if (d) d.style.display = 'none';
};

// 4. Desktop Search Modal
window.openSearch = function() {
    const m = document.getElementById('searchModal');
    if (m) {
        m.style.display = 'flex';
        const input = document.getElementById('modalSearchInput');
        if (input) {
            input.value = '';
            input.focus();
        }
        window.onSearchInput('');
    }
};

window.closeSearch = function() {
    const m = document.getElementById('searchModal');
    if (m) m.style.display = 'none';
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.closeSearch();
        window.closeMobileDrawer();
    }
});

window.onSearchInput = function(query) {
    const q = (query || '').toLowerCase().trim();
    const resultsContainer = document.getElementById('searchResultsList');
    if (!resultsContainer) return;

    if (!q) {
        resultsContainer.innerHTML = `<p class="p-4 text-center text-xs theme-muted">Type to search articles across all published stories...</p>`;
        return;
    }

    const matched = mediumStories.filter(s => 
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.subtitle && s.subtitle.toLowerCase().includes(q)) ||
        (s.author && s.author.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.tags && s.tags.toLowerCase().includes(q))
    );

    if (matched.length === 0) {
        resultsContainer.innerHTML = `<p class="p-4 text-center text-xs theme-muted">No matching stories found for "${query}".</p>`;
        return;
    }

    resultsContainer.innerHTML = matched.map(s => `
        <a href="/${s.slug}" class="block p-3 rounded-xl hover:theme-search-bg transition-colors border theme-border space-y-1">
            <div class="flex items-center gap-2 text-[10px] font-mono theme-muted">
                <span>${s.author}</span>
                <span>•</span>
                <span>${s.date || 'Published'}</span>
            </div>
            <h4 class="font-bold text-sm theme-text">${s.title}</h4>
            <p class="text-xs theme-muted line-clamp-1">${s.subtitle || ''}</p>
        </a>
    `).join('');
};

window.onMobileSearchInput = function(query) {
    window.openSearch();
    const input = document.getElementById('modalSearchInput');
    if (input) {
        input.value = query;
        window.onSearchInput(query);
    }
};

// 5. Render Stories Feed & Sidebar
function renderStoriesFeed(list) {
    const feed = document.getElementById('storiesFeed');
    if (!feed) return;

    if (!list || list.length === 0) {
        feed.innerHTML = `
            <div class="py-16 text-center text-xs theme-muted space-y-3">
                <p class="text-sm font-medium theme-text">No stories found.</p>
                <p class="text-xs">Write and publish articles directly from the Admin Studio.</p>
                <a href="/admin" class="inline-block mt-2 px-5 py-2 rounded-full bg-emerald-600 text-white font-semibold text-xs">Open Admin Studio</a>
            </div>
        `;
        renderSidebarLatestPosts([]);
        return;
    }

    feed.innerHTML = list.map(s => `
        <article class="border-b theme-border pb-8 space-y-3">
            <div class="flex items-center gap-2 text-xs theme-muted font-mono">
                <span class="font-bold theme-text">${s.author}</span>
                <span>•</span>
                <span>${s.date || 'Recently'}</span>
                <span>•</span>
                <span class="px-2 py-0.5 rounded-full theme-search-bg border theme-border uppercase text-[10px]">${s.category || 'General'}</span>
            </div>

            <div class="flex flex-col sm:flex-row gap-6 justify-between items-start">
                <div class="space-y-2 flex-1">
                    <a href="/${s.slug}" class="block group">
                        <h2 class="text-xl sm:text-2xl font-serif font-bold theme-text group-hover:text-emerald-600 transition-colors leading-snug">
                            ${s.title}
                        </h2>
                        ${s.subtitle ? `<p class="text-xs sm:text-sm theme-muted pt-1 line-clamp-2 leading-relaxed">${s.subtitle}</p>` : ''}
                    </a>
                </div>
                ${s.image ? `
                    <a href="/${s.slug}" class="w-full sm:w-36 h-28 shrink-0 rounded-xl overflow-hidden border theme-border">
                        <img src="${s.image}" alt="${s.imageAlt || s.title}" loading="lazy" decoding="async" class="w-full h-full object-cover">
                    </a>
                ` : ''}
            </div>

            <div class="flex items-center justify-between text-xs theme-muted pt-2">
                <span class="font-mono text-[11px]">${s.readTime || '5 min read'}</span>
                <a href="/${s.slug}" class="text-emerald-600 font-semibold hover:underline">Read Story →</a>
            </div>
        </article>
    `).join('');

    renderSidebarLatestPosts(mediumStories);
}

function renderSidebarLatestPosts(list) {
    const container = document.getElementById('sidebarLatestPosts');
    if (!container) return;

    if (!list || list.length === 0) {
        container.innerHTML = `<p class="text-xs theme-muted">No stories published yet.</p>`;
        return;
    }

    const latest = list.slice(0, 5);
    container.innerHTML = latest.map(s => `
        <a href="/${s.slug}" class="block space-y-1 group">
            <div class="flex items-center gap-2 theme-muted text-[11px] font-mono">
                <span>${s.author}</span>
                <span>•</span>
                <span>${s.date || 'Published'}</span>
            </div>
            <h4 class="font-bold theme-text group-hover:underline leading-snug">${s.title}</h4>
        </a>
    `).join('');
}

// 6. Category Selection & Dynamic Render
window.selectCategory = function(catId) {
    activeTopic = catId;
    renderDynamicCategories(globalSettings.categories || []);

    if (catId === 'all') {
        renderStoriesFeed(mediumStories);
    } else {
        const filtered = mediumStories.filter(s => (s.category || '').toLowerCase() === catId.toLowerCase());
        renderStoriesFeed(filtered);
    }
};

function renderDynamicCategories(categories) {
    const topicBar = document.getElementById('topicFilterBar');
    const pillsContainer = document.getElementById('sidebarCategoryPills');

    let tabsHtml = `<button class="topic-tab ${activeTopic === 'all' ? 'theme-text font-semibold active' : 'hover:theme-text transition-colors'}" data-cat="all" onclick="selectCategory('all')">For you</button>`;
    let pillsHtml = `<button type="button" onclick="selectCategory('all')" data-cat-pill="all" class="cat-pill framer-tap px-3.5 py-1.5 rounded-full text-xs font-medium theme-search-bg theme-border border hover:theme-text hover:border-zinc-400 transition-all ${activeTopic === 'all' ? 'active-pill' : ''}">All Topics</button>`;

    if (categories && categories.length > 0) {
        categories.forEach(c => {
            const isSel = activeTopic === c.id;
            tabsHtml += `<button class="topic-tab ${isSel ? 'theme-text font-semibold active' : 'hover:theme-text transition-colors'}" data-cat="${c.id}" onclick="selectCategory('${c.id}')">${c.label}</button>`;
            pillsHtml += `<button type="button" onclick="selectCategory('${c.id}')" data-cat-pill="${c.id}" class="cat-pill framer-tap px-3.5 py-1.5 rounded-full text-xs font-medium theme-search-bg theme-border border hover:theme-text hover:border-zinc-400 transition-all ${isSel ? 'active-pill' : ''}">${c.label}</button>`;
        });
    }

    if (topicBar) topicBar.innerHTML = tabsHtml;
    if (pillsContainer) pillsContainer.innerHTML = pillsHtml;
}

// 7. Newsletter Submission
window.handleNewsletterSubmit = async function(e) {
    e.preventDefault();
    const emailInput = document.getElementById('newsletterEmail');
    const msg = document.getElementById('newsletterMsg');
    if (!emailInput) return;

    const email = emailInput.value.trim();
    if (!email) return;

    const client = window.supabaseClient;
    if (client) {
        try {
            await client.from('subscribers').insert([{ email }]);
        } catch (err) {}
    }

    emailInput.value = '';
    if (msg) {
        msg.classList.remove('hidden');
        setTimeout(() => msg.classList.add('hidden'), 4000);
    }
};

// 8. Fetch Data from Supabase
async function loadLiveFeedData() {
    const client = window.supabaseClient;

    if (client) {
        try {
            const [artRes, setRes] = await Promise.all([
                client.from('articles').select('*').order('created_at', { ascending: false }),
                client.from('site_settings').select('*').eq('key', 'global_settings').single()
            ]);

            if (!setRes.error && setRes.data && setRes.data.value) {
                const parsed = typeof setRes.data.value === 'string' ? JSON.parse(setRes.data.value) : setRes.data.value;
                globalSettings = parsed;
                applyLiveSettings(globalSettings);
            }

            if (!artRes.error && artRes.data) {
                mediumStories = artRes.data.filter(a => a.status === 'published').map(item => ({
                    id: item.id,
                    slug: item.slug,
                    title: item.title,
                    subtitle: item.subtitle,
                    author: item.author,
                    date: item.date,
                    readTime: item.read_time,
                    category: item.category,
                    tags: item.tags,
                    image: item.image,
                    imageAlt: item.image_alt,
                    bodyHtml: item.body_html
                }));
            }
        } catch (e) {
            console.warn("Supabase load error:", e);
        }
    }

    renderStoriesFeed(mediumStories);
}

function applyLiveSettings(s) {
    if (!s) return;
    if (s.site_name) {
        document.querySelectorAll('.site-logo-text').forEach(el => el.textContent = s.site_name);
    }
    if (s.footer_copyright) {
        document.querySelectorAll('.site-copyright-text').forEach(el => el.textContent = `• ${s.footer_copyright}`);
    }
    if (s.hero?.headline) {
        const h = document.querySelector('.hero-headline');
        if (h) h.textContent = s.hero.headline;
    }
    if (s.hero?.subtitle) {
        const sub = document.querySelector('.hero-subtitle');
        if (sub) sub.textContent = s.hero.subtitle;
    }
    renderDynamicCategories(s.categories || []);
}

// Initial Load
loadLiveFeedData();

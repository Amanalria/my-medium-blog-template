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
                <p class="text-xs">Stay tuned for upcoming stories and articles.</p>
            </div>
        `;
        renderSidebarLatestPosts([]);
        return;
    }

    feed.innerHTML = list.map(s => {
        const authorInitial = (s.author || 'M').trim().charAt(0).toUpperCase();
        const readTime = s.readTime || '5 min read';
        const category = s.category || 'General';
        const date = s.date || 'Recently';
        const subtitle = s.subtitle || '';
        
        return `
            <article class="border-b theme-border py-6 first:pt-0">
                <!-- Author Meta Row -->
                <div class="flex items-center gap-2 mb-2.5">
                    <div class="w-5 h-5 rounded-full bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 font-bold text-[10px] flex items-center justify-center font-sans shrink-0">
                        ${authorInitial}
                    </div>
                    <span class="text-xs font-semibold theme-text">${s.author}</span>
                    <span class="text-xs theme-muted">·</span>
                    <span class="text-xs theme-muted font-sans">${date}</span>
                    <span class="text-xs theme-muted hidden sm:inline">·</span>
                    <span class="text-xs font-medium text-emerald-600 hidden sm:inline">${category}</span>
                </div>

                <!-- Main Content & Image Row (Always Side-by-Side like Medium) -->
                <a href="/${s.slug}" class="flex items-start justify-between gap-4 sm:gap-8 group">
                    <div class="flex-1 min-w-0 space-y-1.5">
                        <h2 class="text-base sm:text-xl font-bold font-serif theme-text group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                            ${s.title}
                        </h2>
                        ${subtitle ? `
                            <p class="text-xs sm:text-sm theme-muted font-sans font-normal leading-relaxed line-clamp-2">
                                ${subtitle}
                            </p>
                        ` : ''}

                        <!-- Bottom Meta Info -->
                        <div class="flex items-center gap-3 pt-2 text-[11px] theme-muted font-sans">
                            <span class="px-2 py-0.5 rounded-full theme-search-bg border theme-border font-medium text-[10px] uppercase tracking-wider">${category}</span>
                            <span>${readTime}</span>
                            <span class="text-zinc-400 hidden sm:inline">·</span>
                            <span class="text-emerald-600 font-medium hidden sm:inline">Selected for you</span>
                            
                            <div class="ml-auto flex items-center gap-2 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    ${s.image ? `
                        <div class="w-24 h-20 sm:w-36 sm:h-28 shrink-0 rounded-lg overflow-hidden border theme-border bg-zinc-100 dark:bg-zinc-800 shadow-xs">
                            <img src="${s.image}" alt="${s.imageAlt || s.title}" loading="lazy" decoding="async" class="w-full h-full object-cover">
                        </div>
                    ` : ''}
                </a>
            </article>
        `;
    }).join('');

    renderSidebarLatestPosts(mediumStories);
}

function renderSidebarLatestPosts(list) {
    const container = document.getElementById('sidebarLatestPosts');
    if (!container) return;

    if (!list || list.length === 0) {
        container.innerHTML = `<p class="text-xs theme-muted">No picks yet.</p>`;
        return;
    }

    const latest = list.slice(0, 4);
    container.innerHTML = latest.map(s => {
        const authorInitial = (s.author || 'M').trim().charAt(0).toUpperCase();
        return `
            <a href="/${s.slug}" class="block space-y-1 group">
                <div class="flex items-center gap-2 text-xs theme-muted">
                    <span class="w-4 h-4 rounded-full bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 text-[9px] font-bold flex items-center justify-center">${authorInitial}</span>
                    <span class="font-semibold theme-text text-[11px]">${s.author}</span>
                </div>
                <h4 class="font-bold text-xs sm:text-sm theme-text group-hover:underline leading-snug font-serif line-clamp-2">${s.title}</h4>
            </a>
        `;
    }).join('');

    renderWhoToFollow(list);
}

function renderWhoToFollow(list) {
    const container = document.getElementById('whoToFollowList');
    if (!container) return;

    const authors = [];
    const seen = new Set();
    if (list && list.length > 0) {
        list.forEach(s => {
            if (s.author && !seen.has(s.author)) {
                seen.add(s.author);
                authors.push({
                    name: s.author,
                    category: s.category || 'Writer'
                });
            }
        });
    }

    if (authors.length === 0) {
        authors.push({ name: 'Medium Editorial', category: 'Curated Stories' });
    }

    container.innerHTML = authors.slice(0, 3).map(a => {
        const initial = a.name.trim().charAt(0).toUpperCase();
        return `
            <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">${initial}</div>
                    <div class="min-w-0">
                        <h4 class="font-bold theme-text text-xs truncate">${a.name}</h4>
                        <p class="text-[11px] theme-muted truncate">${a.category}</p>
                    </div>
                </div>
                <button type="button" onclick="this.textContent = this.textContent === 'Follow' ? 'Following' : 'Follow'; this.classList.toggle('bg-zinc-900'); this.classList.toggle('text-white');" class="px-3 py-1 rounded-full border theme-border theme-text text-xs font-medium hover:border-zinc-400 transition-all shrink-0 cursor-pointer">Follow</button>
            </div>
        `;
    }).join('');
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

    let tabsHtml = `<button class="topic-tab ${activeTopic === 'all' ? 'active' : ''}" data-cat="all" onclick="selectCategory('all')">For you</button>`;
    let pillsHtml = `<button type="button" onclick="selectCategory('all')" data-cat-pill="all" class="cat-pill framer-tap px-3.5 py-1.5 rounded-full text-xs font-medium theme-search-bg theme-border border hover:theme-text hover:border-zinc-400 transition-all ${activeTopic === 'all' ? 'active-pill' : ''}">All Topics</button>`;

    if (categories && categories.length > 0) {
        categories.forEach(c => {
            const isSel = activeTopic === c.id;
            tabsHtml += `<button class="topic-tab ${isSel ? 'active' : ''}" data-cat="${c.id}" onclick="selectCategory('${c.id}')">${c.label}</button>`;
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

// 8. Instant Cache Hydration & Supabase Background Sync
function hydrateFromCache() {
    try {
        const cachedSettings = localStorage.getItem('cached_settings');
        if (cachedSettings) {
            globalSettings = JSON.parse(cachedSettings);
            applyLiveSettings(globalSettings);
        }
        const cachedArticles = localStorage.getItem('cached_articles');
        if (cachedArticles) {
            mediumStories = JSON.parse(cachedArticles);
            renderStoriesFeed(mediumStories);
        }
    } catch (e) {}
}

async function loadLiveFeedData() {
    const client = window.supabaseClient;

    if (client) {
        try {
            const [artRes, setRes] = await Promise.all([
                client.from('articles').select('id, slug, title, subtitle, author, date, read_time, category, tags, image, image_alt, body_html, status').order('created_at', { ascending: false }),
                client.from('site_settings').select('*').eq('key', 'global_settings').single()
            ]);

            if (!setRes.error && setRes.data && setRes.data.value) {
                const parsed = typeof setRes.data.value === 'string' ? JSON.parse(setRes.data.value) : setRes.data.value;
                globalSettings = parsed;
                localStorage.setItem('cached_settings', JSON.stringify(globalSettings));
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
                localStorage.setItem('cached_articles', JSON.stringify(mediumStories));
                renderStoriesFeed(mediumStories);
            }
            return;
        } catch (e) {
            console.warn("Supabase load error:", e);
        }
    }

    if (mediumStories.length === 0) {
        renderStoriesFeed([]);
    }
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

// 0ms Instant Hydration + Background SWR
hydrateFromCache();
loadLiveFeedData();


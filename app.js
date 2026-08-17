// Medium.com Authentic Ultra-Fast Core Engine (100% Vanilla JS & SEO Ready)

const API_BASE = window.location.origin;
let globalSettings = {};

// 1. Reading Progress Bar with rAF Throttle (Zero Main-Thread Jitter)
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

// 2. Safe Optional Lenis Smooth Inertial Scroll
try {
    if (typeof window.Lenis !== 'undefined') {
        const lenis = new window.Lenis({
            duration: 0.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }
} catch(e) {}

// 3. Dynamic Stories Data Store (Loaded from Supabase)
let mediumStories = [];

// 4. Render Stories Feed Function with In-Feed AdSense Insertion & Native Lazy Loading
const storiesFeed = document.getElementById('storiesFeed');

function renderStoriesFeed(list) {
    if (!storiesFeed) return;

    if (!list || list.length === 0) {
        storiesFeed.innerHTML = `
            <div class="py-16 text-center text-xs theme-muted space-y-3">
                <p class="text-sm font-medium theme-text">No stories found.</p>
                <p class="text-xs">Write and publish articles directly from the Admin Studio.</p>
                <a href="/admin" class="inline-block mt-2 px-5 py-2 rounded-full bg-emerald-600 text-white font-semibold text-xs">Open Admin Studio</a>
            </div>
        `;
        return;
    }

    const inFeedAdEnabled = globalSettings?.monetization?.in_feed_ad_enabled;
    const inFeedAdCode = globalSettings?.monetization?.in_feed_ad_code;
    const animationsOn = globalSettings?.animations_enabled !== false;

    let html = '';
    list.forEach((story, idx) => {
        html += `
            <article class="medium-story-card ${animationsOn ? 'scroll-reveal' : 'is-visible'} border-b theme-border pb-8 space-y-3 cursor-pointer group" onclick="window.location.href='/${story.slug}'">
                <div class="flex items-center gap-2 text-xs theme-text">
                    <div class="w-5 h-5 rounded-full bg-zinc-800 text-white font-bold flex items-center justify-center text-[10px]">
                        ${story.authorInitials || 'AU'}
                    </div>
                    <span class="font-bold hover:underline">${story.author}</span>
                    <span class="theme-muted text-[11px]">in</span>
                    <span class="font-medium hover:underline">${story.publication || 'Journal'}</span>
                    <span class="theme-muted">•</span>
                    <span class="theme-muted text-[11px]">${story.date}</span>
                </div>

                <div class="flex items-start justify-between gap-6">
                    <div class="space-y-1.5 flex-1">
                        <h2 class="text-lg sm:text-xl font-serif font-bold theme-text leading-snug group-hover:text-emerald-600 transition-colors">
                            ${story.title}
                        </h2>
                        <p class="text-xs sm:text-sm theme-muted leading-relaxed font-sans line-clamp-2">
                            ${story.subtitle || ''}
                        </p>
                    </div>
                    <div class="w-20 sm:w-28 h-20 sm:h-24 shrink-0 rounded-lg overflow-hidden border theme-border bg-zinc-100 dark:bg-zinc-800">
                        <img src="${story.image}" alt="${story.imageAlt || story.title}" loading="lazy" decoding="async" class="w-full h-full object-cover">
                    </div>
                </div>

                <div class="flex items-center gap-3 text-xs pt-2">
                    ${story.isMember ? '<span class="text-amber-500 font-bold" title="Member-only story">★</span>' : ''}
                    <span class="theme-muted text-[11px] font-mono">${story.readTime}</span>
                    <span class="px-2.5 py-0.5 rounded-full theme-search-bg theme-border border text-[11px] font-medium theme-muted">
                        ${(story.category || 'tech').toUpperCase()}
                    </span>
                </div>
            </article>
        `;

        // Inject Native In-Feed AdSense after Story 3
        if (inFeedAdEnabled && idx === 2) {
            html += `
                <div class="p-4 my-6 rounded-xl border border-dashed theme-border theme-search-bg text-center text-xs theme-muted">
                    <span class="text-[10px] font-mono uppercase text-zinc-400 block mb-1">Sponsored Advertisement</span>
                    <div class="adsense-slot-container">${inFeedAdCode || '<!-- In-Feed Ad Slot -->'}</div>
                </div>
            `;
        }
    });

    storiesFeed.innerHTML = html;
    if (animationsOn) initScrollObserver();
}

// 5. Scroll-Driven IntersectionObserver
let scrollObserver;
function initScrollObserver() {
    if (scrollObserver) scrollObserver.disconnect();

    const elements = document.querySelectorAll('.scroll-reveal');
    if (!('IntersectionObserver' in window)) {
        elements.forEach(el => el.classList.add('is-visible'));
        return;
    }

    scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, {
        threshold: 0.04,
        rootMargin: '0px 0px 100px 0px'
    });

    elements.forEach(el => scrollObserver.observe(el));
}

// 6. Topic Filter Tabs & Bidirectional Sync
let activeTopic = 'all';

function syncCategoryUI(cat) {
    const tabs = document.querySelectorAll('.topic-tab');
    tabs.forEach(t => {
        const isSelected = t.getAttribute('data-cat') === cat;
        t.classList.toggle('theme-text', isSelected);
        t.classList.toggle('font-semibold', isSelected);
        t.classList.toggle('border-b-2', isSelected);
        t.classList.toggle('border-current', isSelected);
        t.classList.toggle('theme-muted', !isSelected);
    });

    const pills = document.querySelectorAll('.cat-pill');
    pills.forEach(p => {
        const isSelected = p.getAttribute('data-cat-pill') === cat;
        p.classList.toggle('active-pill', isSelected);
    });
}

window.selectCategory = function(cat) {
    activeTopic = cat;
    syncCategoryUI(cat);
    filterFeed();
    const feed = document.getElementById('feedSection');
    if (feed) feed.scrollIntoView({ behavior: 'smooth' });
};

function filterFeed() {
    const filtered = activeTopic === 'all' 
        ? mediumStories 
        : mediumStories.filter(s => s.category === activeTopic);
    renderStoriesFeed(filtered);
}

// 7. Mobile Side-Drawer Menu
window.openMobileDrawer = function() {
    const drawer = document.getElementById('mobileDrawer');
    if (!drawer) return;
    drawer.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.closeMobileDrawer = function() {
    const drawer = document.getElementById('mobileDrawer');
    if (!drawer) return;
    drawer.style.display = 'none';
    document.body.style.overflow = '';
};

window.onMobileSearchInput = function(query) {
    const q = (query || '').toLowerCase().trim();
    const filtered = mediumStories.filter(s => {
        const matchesTopic = activeTopic === 'all' || s.category === activeTopic;
        const matchesQuery = !q || s.title.toLowerCase().includes(q) || (s.subtitle && s.subtitle.toLowerCase().includes(q));
        return matchesTopic && matchesQuery;
    });
    renderStoriesFeed(filtered);
};

const mobileDrawerEl = document.getElementById('mobileDrawer');
if (mobileDrawerEl) {
    mobileDrawerEl.addEventListener('click', function(e) {
        if (e.target === mobileDrawerEl) window.closeMobileDrawer();
    });
}

// 8. Desktop Search Modal
window.openSearch = function() {
    const modal = document.getElementById('searchModal');
    const input = document.getElementById('modalSearchInput');
    if (!modal) return;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
        if (input) {
            input.focus();
            window.onSearchInput(input.value);
        }
    }, 50);
};

window.closeSearch = function() {
    const modal = document.getElementById('searchModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
};

window.onSearchInput = function(query) {
    const list = document.getElementById('searchResultsList');
    if (!list) return;

    const q = (query || '').toLowerCase().trim();
    if (!q) {
        list.innerHTML = `
            <div class="py-6 text-center text-xs theme-muted">
                Type above to search stories, topics, and authors.
            </div>
        `;
        return;
    }

    const matches = mediumStories.filter(s => 
        s.title.toLowerCase().includes(q) || 
        (s.subtitle && s.subtitle.toLowerCase().includes(q)) || 
        s.author.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q))
    );

    if (matches.length === 0) {
        list.innerHTML = `
            <div class="py-6 text-center text-xs theme-muted">
                No matching stories found for "<span class="theme-text font-bold">${query}</span>".
            </div>
        `;
        return;
    }

    list.innerHTML = matches.map(s => `
        <a href="/${s.slug}" class="block p-3 rounded-xl hover:theme-search-bg transition-colors border theme-border space-y-1">
            <div class="flex items-center gap-2 text-[11px] font-mono theme-muted">
                <span>${s.author}</span>
                <span>•</span>
                <span class="uppercase">${s.category}</span>
            </div>
            <h4 class="font-bold text-xs sm:text-sm theme-text leading-snug">${s.title}</h4>
            <p class="text-[11px] theme-muted line-clamp-1">${s.subtitle || ''}</p>
        </a>
    `).join('');
};

window.selectQuickSearch = function(keyword) {
    const input = document.getElementById('modalSearchInput');
    if (input) {
        input.value = keyword;
        window.onSearchInput(keyword);
    }
};

const searchModalEl = document.getElementById('searchModal');
if (searchModalEl) {
    searchModalEl.addEventListener('click', function(e) {
        if (e.target === searchModalEl) window.closeSearch();
    });
}

// 9. Light/Dark Theme Switcher Logic
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
    
    const badge = document.getElementById('currentThemeBadge');
    if (badge) badge.textContent = isDark ? 'Dark' : 'Light';
}

updateThemeIcons();

function getClient() {
    return window.supabaseClient || (window.supabase && typeof window.supabase.createClient === 'function' ? window.supabase.createClient("https://dpludxwkiunmfenjjafh.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbHVkeHdraXVubWZlbmpqYWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTQzMzUsImV4cCI6MjEwMjUzMDMzNX0.HR6PY7V1do9uV1g0WwRpBhZYOVXszCMknmMoMZrkAoY") : null);
}

// 10. Load Live Articles & Settings from Supabase Cloud or Local API
async function loadLiveFeedData() {
    const client = getClient();
    // 1. Try Supabase Cloud Database first
    if (client) {
        try {
            const [artRes, setRes] = await Promise.all([
                client.from('articles').select('*').order('created_at', { ascending: false }),
                client.from('site_settings').select('*').eq('key', 'global_settings').single()
            ]);

            if (!setRes.error && setRes.data && setRes.data.value) {
                const parsed = typeof setRes.data.value === 'string' ? JSON.parse(setRes.data.value) : setRes.data.value;
                globalSettings = Object.assign(globalSettings, parsed);
                applyLiveSettings(globalSettings);
            }

            if (!artRes.error && artRes.data && artRes.data.length > 0) {
                mediumStories = artRes.data.filter(a => a.status === 'published').map(item => ({
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
                    status: item.status
                }));
                renderStoriesFeed(mediumStories);
                return;
            }
        } catch (e) {
            console.warn("Supabase fetch failed on feed:", e);
        }
    }

    // 2. Fallback to Local API or initial
    try {
        const [articlesRes, settingsRes] = await Promise.all([
            fetch(`${API_BASE}/api/v1/articles`),
            fetch(`${API_BASE}/api/v1/settings`)
        ]);

        if (settingsRes.ok) {
            globalSettings = await settingsRes.json();
            applyLiveSettings(globalSettings);
        }

        if (articlesRes.ok) {
            const data = await articlesRes.json();
            if (data.success && data.articles && data.articles.length > 0) {
                mediumStories = data.articles.filter(a => a.status === 'published');
                renderStoriesFeed(mediumStories);
            }
        }
    } catch (e) {
        renderStoriesFeed(mediumStories);
    }
}

function applyLiveSettings(s) {
    if (!s) return;

    // Site Name & SEO Titles
    if (s.site_name) {
        document.querySelectorAll('.site-logo-text').forEach(el => el.textContent = s.site_name);
    }
    if (s.seo?.meta_title) {
        document.title = s.seo.meta_title;
    }

    // Hero Section Controls & Background Image
    const heroSection = document.getElementById('heroBannerSection');
    if (heroSection) {
        if (s.hero?.enabled === false) {
            heroSection.style.display = 'none';
        } else {
            heroSection.style.display = 'block';
            if (s.hero?.headline) {
                const h = heroSection.querySelector('.hero-headline');
                if (h) h.textContent = s.hero.headline;
            }
            if (s.hero?.subtitle) {
                const p = heroSection.querySelector('.hero-subtitle');
                if (p) p.textContent = s.hero.subtitle;
            }
            if (s.hero?.bg_image) {
                heroSection.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${s.hero.bg_image}')`;
                heroSection.style.backgroundSize = 'cover';
                heroSection.style.backgroundPosition = 'center';
                heroSection.classList.add('text-white');
            }
        }
    }

    // Brand Accent Color
    if (s.brand_color) {
        document.documentElement.style.setProperty('--accent-green', s.brand_color);
    }

    // Dynamic Categories Tabs & Pills
    if (s.categories && s.categories.length > 0) {
        renderDynamicCategories(s.categories);
    }

    // Google AdSense Auto Ads Script Injection
    if (s.monetization?.adsense_enabled && s.monetization?.adsense_client_id) {
        injectAdSenseScript(s.monetization.adsense_client_id);
    }

    // Google Analytics GA4 Script Injection
    if (s.analytics?.ga_measurement_id) {
        injectGoogleAnalytics(s.analytics.ga_measurement_id);
    }

    // Custom <head> Code Injection
    if (s.analytics?.custom_head_code) {
        const div = document.createElement('div');
        div.innerHTML = s.analytics.custom_head_code;
        document.head.appendChild(div);
    }
}

function renderDynamicCategories(categories) {
    const pillsContainer = document.getElementById('sidebarCategoryPills');
    if (pillsContainer) {
        pillsContainer.innerHTML = `
            <button onclick="selectCategory('all')" data-cat-pill="all" class="cat-pill active-pill framer-tap px-3 py-1.5 rounded-full text-xs font-medium theme-card border theme-border theme-text hover:border-zinc-400 transition-all">
                All Topics
            </button>
        ` + categories.map(c => `
            <button onclick="selectCategory('${c.id}')" data-cat-pill="${c.id}" class="cat-pill framer-tap px-3 py-1.5 rounded-full text-xs font-medium theme-card border theme-border theme-text hover:border-zinc-400 transition-all">
                ${c.label}
            </button>
        `).join('');
    }
}

function injectAdSenseScript(clientId) {
    if (document.getElementById('adsense-script')) return;
    const script = document.createElement('script');
    script.id = 'adsense-script';
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
}

function injectGoogleAnalytics(gaId) {
    if (document.getElementById('ga-script')) return;
    const script1 = document.createElement('script');
    script1.id = 'ga-script';
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
    `;
    document.head.appendChild(script2);
}

// Initial Load
loadLiveFeedData();

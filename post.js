// Medium.com Authentic Ultra-Fast Story Reader Engine (100% Vanilla JS & SEO Schema)

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

// 2. Default Initial Stories Database (Dynamic from Supabase)
let mediumStories = [];

// 3. Load Current Story by Clean URL Slug or Query Param
const urlParams = new URLSearchParams(window.location.search);
const pathSlug = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/').pop();
const cleanPathSlug = (pathSlug && !pathSlug.includes('.') && pathSlug !== 'post') ? pathSlug : null;
const currentSlug = urlParams.get('slug') || cleanPathSlug || "";
let currentStory = null;

function renderStoryDetails(story) {
    if (!story) {
        document.title = "Story Not Found – Medium";
        const titleEl = document.getElementById('storyTitle');
        const subtitleEl = document.getElementById('storySubtitle');
        const proseEl = document.querySelector('.medium-prose');
        const heroImgEl = document.getElementById('storyHeroImage');
        if (heroImgEl && heroImgEl.parentElement) heroImgEl.parentElement.style.display = 'none';
        if (titleEl) titleEl.textContent = "Story Not Found";
        if (subtitleEl) subtitleEl.textContent = "The requested article does not exist or has been removed.";
        if (proseEl) proseEl.innerHTML = `
            <div class="py-12 text-center theme-muted space-y-4">
                <p>Please check the URL or browse all stories on our homepage.</p>
                <a href="/" class="inline-block px-5 py-2 rounded-full bg-emerald-600 text-white font-semibold text-xs">Return to Homepage</a>
            </div>
        `;
        return;
    }

    // Dynamic SEO Metadata & Google Title
    document.title = `${story.title} – Medium`;
    
    const titleEl = document.getElementById('storyTitle');
    const subtitleEl = document.getElementById('storySubtitle');
    const authorEl = document.getElementById('storyAuthor');
    const authorAvatarEl = document.getElementById('storyAuthorAvatar');
    const authorCardAvatarEl = document.getElementById('authorCardAvatar');
    const authorCardNameEl = document.getElementById('authorCardName');
    const dateEl = document.getElementById('storyDate');
    const readTimeEl = document.getElementById('storyReadTime');
    const heroImgEl = document.getElementById('storyHeroImage');
    const proseEl = document.querySelector('.medium-prose');

    if (titleEl) titleEl.textContent = story.title;
    if (subtitleEl) subtitleEl.textContent = story.subtitle || '';
    if (authorEl) authorEl.textContent = story.author;
    if (authorAvatarEl) authorAvatarEl.textContent = story.authorInitials || "AU";
    if (authorCardAvatarEl) authorCardAvatarEl.textContent = story.authorInitials || "AU";
    if (authorCardNameEl) authorCardNameEl.textContent = `Written by ${story.author}`;
    if (dateEl) dateEl.textContent = story.date;
    if (readTimeEl) readTimeEl.textContent = story.readTime;
    if (heroImgEl) {
        if (story.image) {
            heroImgEl.src = story.image;
            heroImgEl.alt = story.imageAlt || story.title;
            heroImgEl.loading = "lazy";
            heroImgEl.decoding = "async";
            if (heroImgEl.parentElement) heroImgEl.parentElement.style.display = 'block';
        } else {
            if (heroImgEl.parentElement) heroImgEl.parentElement.style.display = 'none';
        }
    }

    if (proseEl && story.bodyHtml) {
        let contentHtml = story.bodyHtml;

        // In-Article AdSense Injection (Mid-way after first <h2> or <blockquote>)
        if (globalSettings?.monetization?.in_article_ad_enabled) {
            const adBlock = `
                <div class="p-4 my-6 rounded-xl border border-dashed theme-border theme-search-bg text-center text-xs theme-muted not-prose">
                    <span class="text-[10px] font-mono uppercase text-zinc-400 block mb-1">Sponsored Advertisement</span>
                    <div class="adsense-slot-container">${globalSettings.monetization.in_article_ad_code || '<!-- In-Article Ad Slot -->'}</div>
                </div>
            `;
            if (contentHtml.includes('<h2>')) {
                contentHtml = contentHtml.replace('<h2>', `${adBlock}<h2>`);
            } else {
                contentHtml += adBlock;
            }
        }

        proseEl.innerHTML = contentHtml;
    }

    renderStoryTags(story.tags);
    injectGoogleJsonLdSchema(story);
    setupSocialShareLinks(story);
}

// 4. Render Article Tags
function renderStoryTags(tagsStr) {
    const container = document.getElementById('storyTagsContainer');
    if (!container) return;
    if (!tagsStr) {
        container.style.display = 'none';
        return;
    }
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    if (tags.length === 0) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'flex';
    container.innerHTML = tags.map(t => `
        <span class="px-3 py-1 rounded-full theme-search-bg border theme-border text-xs font-mono theme-muted">#${t}</span>
    `).join('');
}

// 5. Inject Google JSON-LD Structured Data Schema for Rich Snippets
function injectGoogleJsonLdSchema(story) {
    if (document.getElementById('google-json-ld')) return;
    const script = document.createElement('script');
    script.id = 'google-json-ld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": story.title,
        "description": story.subtitle || story.title,
        "image": [story.image],
        "datePublished": story.createdAt || new Date().toISOString(),
        "author": [{
            "@type": "Person",
            "name": story.author
        }],
        "publisher": {
            "@type": "Organization",
            "name": globalSettings.site_name || "Medium",
            "logo": {
                "@type": "ImageObject",
                "url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=75"
            }
        }
    });
    document.head.appendChild(script);
}

// 6. Social Share Links (WhatsApp, Twitter/X, Facebook, Copy Link)
function setupSocialShareLinks(story) {
    const currentUrl = window.location.href;
    const shareText = encodeURIComponent(`${story.title} on Medium`);
    const encodedUrl = encodeURIComponent(currentUrl);

    const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');
    const shareTwitterBtn = document.getElementById('shareTwitterBtn');
    const shareFacebookBtn = document.getElementById('shareFacebookBtn');

    if (shareWhatsAppBtn) shareWhatsAppBtn.href = `https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}`;
    if (shareTwitterBtn) shareTwitterBtn.href = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`;
    if (shareFacebookBtn) shareFacebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
}

window.shareCurrentStory = function() {
    if (navigator.share) {
        navigator.share({
            title: currentStory.title,
            text: currentStory.subtitle || '',
            url: window.location.href,
        }).catch(() => {});
    } else {
        window.copyStoryLink();
    }
};

window.copyStoryLink = function() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        const textSpan = document.getElementById('copyLinkText');
        if (textSpan) {
            const original = textSpan.textContent;
            textSpan.textContent = 'Copied!';
            setTimeout(() => { textSpan.textContent = original; }, 2000);
        }
    }).catch(() => {
        alert('URL copied to clipboard!');
    });
};

// 7. Follow Author Toggle
const followBtn = document.getElementById('followAuthorBtn');
if (followBtn) {
    followBtn.addEventListener('click', () => {
        const isFollowing = followBtn.textContent.trim() === 'Following';
        followBtn.textContent = isFollowing ? 'Follow' : 'Following';
        followBtn.classList.toggle('bg-emerald-600', !isFollowing);
        followBtn.classList.toggle('text-white', !isFollowing);
    });
}

// 8. Dynamic Comments Counter
function updateCommentCounters() {
    const list = document.getElementById('commentList');
    const count = list ? list.children.length : 0;
    
    const countEl = document.getElementById('commentCount');
    const topBadgeEl = document.getElementById('topCommentsBadge');
    
    if (countEl) countEl.textContent = count.toString();
    if (topBadgeEl) topBadgeEl.textContent = count.toString();
}

updateCommentCounters();

const commentForm = document.getElementById('commentForm');
const commentInput = document.getElementById('commentInput');
const commentList = document.getElementById('commentList');

if (commentForm && commentInput && commentList) {
    commentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = commentInput.value.trim();
        if (!text) return;

        const newComment = document.createElement('div');
        newComment.className = 'p-3.5 rounded-xl theme-card border theme-border space-y-1';
        newComment.innerHTML = `
            <div class="flex justify-between font-bold theme-text">
                <span>You</span>
                <span class="text-[10px] theme-muted font-normal">Just now</span>
            </div>
            <p class="theme-text">${text}</p>
        `;
        commentList.prepend(newComment);
        commentInput.value = '';
        updateCommentCounters();
    });
}

// 9. Inject Related Stories
function injectRelatedStories(list, current) {
    const relatedGrid = document.getElementById('relatedStoriesGrid');
    if (!relatedGrid) return;
    if (!list || list.length === 0 || !current) {
        relatedGrid.innerHTML = `<p class="col-span-3 text-xs theme-muted text-center py-4">No related stories available yet.</p>`;
        return;
    }
    const otherStories = list.filter(s => s.slug !== current.slug).slice(0, 3);
    if (otherStories.length === 0) {
        relatedGrid.innerHTML = `<p class="col-span-3 text-xs theme-muted text-center py-4">No more stories in this topic yet.</p>`;
        return;
    }
    relatedGrid.innerHTML = otherStories.map(s => `
        <a href="/${s.slug}" class="framer-tap block rounded-xl theme-card border theme-border overflow-hidden hover:border-zinc-400 transition-all p-3 space-y-2 group">
            ${s.image ? `<img src="${s.image}" alt="${s.imageAlt || s.title}" loading="lazy" decoding="async" class="w-full h-28 object-cover rounded-lg">` : ''}
            <div class="space-y-1">
                <span class="text-[10px] font-mono theme-muted">${s.author} • ${s.readTime}</span>
                <h4 class="text-xs font-bold theme-text group-hover:text-emerald-600 line-clamp-2 leading-snug">${s.title}</h4>
            </div>
        </a>
    `).join('');
}

// 10. Inject Bottom Trending List
function injectTrendingList(list, current) {
    const bottomTrendingList = document.getElementById('bottomTrendingList');
    if (!bottomTrendingList) return;
    if (!list || list.length === 0 || !current) {
        bottomTrendingList.innerHTML = `<p class="text-xs theme-muted">No trending stories yet.</p>`;
        return;
    }
    const trending = list.filter(s => s.slug !== current.slug).slice(3, 6);
    if (trending.length === 0) {
        bottomTrendingList.innerHTML = `<p class="text-xs theme-muted">Explore more articles from the homepage feed.</p>`;
        return;
    }
    bottomTrendingList.innerHTML = trending.map(s => `
        <a href="/${s.slug}" class="block space-y-0.5 group">
            <div class="flex items-center gap-2 theme-muted text-[11px] font-mono">
                <span>${s.author}</span>
                <span>•</span>
                <span>${s.date}</span>
            </div>
            <h4 class="font-bold text-xs theme-text group-hover:underline leading-snug">${s.title}</h4>
        </a>
    `).join('');
}

// 11. Light/Dark Theme Switcher Logic
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

// 12. Load Live Story from Supabase Cloud or Local API
async function loadLiveStory() {
    const client = getClient();
    // 1. Try Supabase Cloud first
    if (client) {
        try {
            const [artRes, setRes, singleArtRes] = await Promise.all([
                client.from('articles').select('*'),
                client.from('site_settings').select('*').eq('key', 'global_settings').single(),
                client.from('articles').select('*').eq('slug', currentSlug).single()
            ]);

            if (!setRes.error && setRes.data && setRes.data.value) {
                const parsed = typeof setRes.data.value === 'string' ? JSON.parse(setRes.data.value) : setRes.data.value;
                globalSettings = Object.assign(globalSettings, parsed);
                if (globalSettings.brand_color) {
                    document.documentElement.style.setProperty('--accent-green', globalSettings.brand_color);
                }
            }

            if (!singleArtRes.error && singleArtRes.data) {
                const item = singleArtRes.data;
                currentStory = {
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
                    isMember: Boolean(item.is_member),
                    image: item.image,
                    imageAlt: item.image_alt,
                    bodyHtml: item.body_html,
                    status: item.status
                };
            } else if (!artRes.error && artRes.data && artRes.data.length > 0) {
                const found = artRes.data.find(s => s.slug === currentSlug);
                if (found) {
                    currentStory = {
                        id: found.id,
                        slug: found.slug,
                        title: found.title,
                        subtitle: found.subtitle,
                        author: found.author,
                        publication: found.publication,
                        authorInitials: found.author_initials,
                        date: found.date,
                        readTime: found.read_time,
                        category: found.category,
                        tags: found.tags,
                        isMember: Boolean(found.is_member),
                        image: found.image,
                        imageAlt: found.image_alt,
                        bodyHtml: found.body_html,
                        status: found.status
                    };
                }
            }

            if (!artRes.error && artRes.data) {
                mediumStories = artRes.data.map(item => ({
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
                    isMember: Boolean(item.is_member),
                    image: item.image,
                    imageAlt: item.image_alt,
                    bodyHtml: item.body_html,
                    status: item.status
                }));
            }

            renderStoryDetails(currentStory);
            injectRelatedStories(mediumStories, currentStory);
            injectTrendingList(mediumStories, currentStory);
            renderPostCategories(globalSettings.categories || []);
            return;
        } catch(e) {
            console.warn("Supabase fetch failed on post:", e);
        }
    }

    // 2. Fallback to Local API
    try {
        const [articlesRes, settingsRes] = await Promise.all([
            fetch(`${API_BASE}/api/v1/articles`),
            fetch(`${API_BASE}/api/v1/settings`)
        ]);

        if (settingsRes.ok) {
            globalSettings = await settingsRes.json();
            if (globalSettings.brand_color) {
                document.documentElement.style.setProperty('--accent-green', globalSettings.brand_color);
            }
        }

        if (articlesRes.ok) {
            const data = await articlesRes.json();
            if (data.success && data.articles && data.articles.length > 0) {
                mediumStories = data.articles;
                const found = mediumStories.find(s => s.slug === currentSlug);
                if (found) currentStory = found;
            }
        }
    } catch(e) {
        console.warn('API sync fallback to static:', e);
    }
    
    renderStoryDetails(currentStory);
    injectRelatedStories(mediumStories, currentStory);
    injectTrendingList(mediumStories, currentStory);
}

function renderPostCategories(categories) {
    const container = document.getElementById('postBottomCategoryPills');
    if (!container) return;
    let html = `<a href="/" class="cat-pill framer-tap px-3.5 py-1.5 rounded-full text-xs font-medium theme-search-bg theme-border border hover:theme-text hover:border-zinc-400 transition-all">All Topics</a>`;
    if (categories && categories.length > 0) {
        html += categories.map(c => `
            <a href="/?cat=${c.id}" class="cat-pill framer-tap px-3.5 py-1.5 rounded-full text-xs font-medium theme-search-bg theme-border border hover:theme-text hover:border-zinc-400 transition-all">
                ${c.label}
            </a>
        `).join('');
    }
    container.innerHTML = html;
}

// Initial Load
loadLiveStory();

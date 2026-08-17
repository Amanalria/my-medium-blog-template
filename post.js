// ================================================================
// MEDIUM STORY READER ENGINE (PRISTINE & 100% DYNAMIC)
// ================================================================

let globalSettings = {};
let mediumStories = [];
let currentStory = null;

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

// 4. Resolve Story Slug
const urlParams = new URLSearchParams(window.location.search);
const pathSlug = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/').pop();
const cleanPathSlug = (pathSlug && !pathSlug.includes('.') && pathSlug !== 'post') ? pathSlug : null;
const currentSlug = urlParams.get('slug') || cleanPathSlug || "";

// 5. Render Story Details
function renderStoryDetails(story) {
    const authorTopBar = document.getElementById('authorTopBar');
    const socialShareSection = document.getElementById('socialShareSection');
    const authorBioFooter = document.getElementById('authorBioFooter');
    const responsesSection = document.getElementById('responsesSection');
    const heroFigure = document.getElementById('heroFigure');

    if (!story) {
        document.title = "Story Not Found – Medium";
        const titleEl = document.getElementById('storyTitle');
        const subtitleEl = document.getElementById('storySubtitle');
        const proseEl = document.querySelector('.medium-prose');

        if (heroFigure) heroFigure.classList.add('hidden');
        if (authorTopBar) { authorTopBar.classList.add('hidden'); authorTopBar.classList.remove('flex'); }
        if (socialShareSection) socialShareSection.classList.add('hidden');
        if (authorBioFooter) authorBioFooter.classList.add('hidden');
        if (responsesSection) responsesSection.classList.add('hidden');

        if (titleEl) titleEl.textContent = "Story Not Found";
        if (subtitleEl) subtitleEl.textContent = "The requested article does not exist or has been removed.";
        if (proseEl) {
            proseEl.innerHTML = `
                <div class="py-12 text-center theme-muted space-y-4">
                    <p>Please check the URL or browse all stories on our homepage.</p>
                    <a href="/" class="inline-block px-5 py-2 rounded-full bg-emerald-600 text-white font-semibold text-xs">Return to Homepage</a>
                </div>
            `;
        }
        return;
    }

    // Dynamic Title
    document.title = `${story.title} – Medium`;

    // Reveal story sections
    if (authorTopBar) { authorTopBar.classList.remove('hidden'); authorTopBar.classList.add('flex'); }
    if (socialShareSection) socialShareSection.classList.remove('hidden');
    if (authorBioFooter) authorBioFooter.classList.remove('hidden');
    if (responsesSection) responsesSection.classList.remove('hidden');

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
    
    const initials = story.author ? story.author.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'AU';
    if (authorAvatarEl) authorAvatarEl.textContent = initials;
    if (authorCardAvatarEl) authorCardAvatarEl.textContent = initials;
    if (authorCardNameEl) authorCardNameEl.textContent = `Written by ${story.author}`;

    if (dateEl) dateEl.textContent = story.date || 'Published';
    if (readTimeEl) readTimeEl.textContent = story.readTime || '5 min read';

    if (heroImgEl && heroFigure) {
        if (story.image) {
            heroImgEl.src = story.image;
            heroImgEl.alt = story.imageAlt || story.title;
            heroFigure.classList.remove('hidden');
        } else {
            heroFigure.classList.add('hidden');
        }
    }

    if (proseEl && story.bodyHtml) {
        proseEl.innerHTML = story.bodyHtml;
    }

    renderStoryTags(story.tags);
    setupSocialShareLinks(story);
}

function renderStoryTags(tagsString) {
    const container = document.getElementById('storyTagsContainer');
    if (!container) return;
    if (!tagsString) {
        container.innerHTML = '';
        return;
    }
    const tags = tagsString.split(',').map(t => t.trim()).filter(Boolean);
    container.innerHTML = tags.map(t => `
        <span class="px-3.5 py-1.5 rounded-full text-xs font-medium theme-search-bg theme-border border theme-muted">
            ${t}
        </span>
    `).join('');
}

// 6. Social Share & Copy Link
function setupSocialShareLinks(story) {
    const pageUrl = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(story.title || document.title);

    const wa = document.getElementById('shareWhatsAppBtn');
    const tw = document.getElementById('shareTwitterBtn');
    const fb = document.getElementById('shareFacebookBtn');

    if (wa) wa.href = `https://api.whatsapp.com/send?text=${title}%20${pageUrl}`;
    if (tw) tw.href = `https://twitter.com/intent/tweet?text=${title}&url=${pageUrl}`;
    if (fb) fb.href = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`;
}

window.shareCurrentStory = function() {
    if (navigator.share) {
        navigator.share({
            title: document.title,
            url: window.location.href
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

// 7. Follow Toggle
const followBtn = document.getElementById('followAuthorBtn');
if (followBtn) {
    followBtn.addEventListener('click', () => {
        const isFollowing = followBtn.textContent.trim() === 'Following';
        followBtn.textContent = isFollowing ? 'Follow' : 'Following';
        followBtn.classList.toggle('bg-emerald-600', !isFollowing);
        followBtn.classList.toggle('text-white', !isFollowing);
    });
}

// 8. Dynamic Comments System
function updateCommentCounters() {
    const list = document.getElementById('commentList');
    const count = list ? list.querySelectorAll('.comment-item').length : 0;
    
    const countEl = document.getElementById('commentCount');
    const topBadgeEl = document.getElementById('topCommentsBadge');
    
    if (countEl) countEl.textContent = count.toString();
    if (topBadgeEl) topBadgeEl.textContent = count.toString();
}

const commentForm = document.getElementById('commentForm');
const commentInput = document.getElementById('commentInput');
const commentList = document.getElementById('commentList');

if (commentForm && commentInput && commentList) {
    commentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = commentInput.value.trim();
        if (!text) return;

        const emptyMsg = document.getElementById('emptyCommentsMsg');
        if (emptyMsg) emptyMsg.remove();

        const newComment = document.createElement('div');
        newComment.className = 'comment-item p-3.5 rounded-xl theme-card border theme-border space-y-1';
        newComment.innerHTML = `
            <div class="flex justify-between font-bold theme-text">
                <span>Reader</span>
                <span class="text-[10px] theme-muted font-normal">Just now</span>
            </div>
            <p class="theme-text">${text}</p>
        `;
        commentList.prepend(newComment);
        commentInput.value = '';
        updateCommentCounters();
    });
}

// 9. Related & Trending Stories
function injectRelatedStories(list, current) {
    const relatedGrid = document.getElementById('relatedStoriesGrid');
    if (!relatedGrid) return;
    if (!list || list.length === 0 || !current) {
        relatedGrid.innerHTML = `<p class="col-span-3 text-xs theme-muted text-center py-4">No related stories available yet.</p>`;
        return;
    }
    const otherStories = list.filter(s => s.slug !== current.slug).slice(0, 3);
    if (otherStories.length === 0) {
        relatedGrid.innerHTML = `<p class="col-span-3 text-xs theme-muted text-center py-4">No more stories published yet.</p>`;
        return;
    }
    relatedGrid.innerHTML = otherStories.map(s => `
        <a href="/${s.slug}" class="framer-tap block rounded-xl theme-card border theme-border overflow-hidden hover:border-zinc-400 transition-all p-3 space-y-2 group">
            ${s.image ? `<img src="${s.image}" alt="${s.imageAlt || s.title}" loading="lazy" decoding="async" class="w-full h-28 object-cover rounded-lg">` : ''}
            <div class="space-y-1">
                <span class="text-[10px] font-mono theme-muted">${s.author} • ${s.readTime || '5 min read'}</span>
                <h4 class="text-xs font-bold theme-text group-hover:text-emerald-600 line-clamp-2 leading-snug">${s.title}</h4>
            </div>
        </a>
    `).join('');
}

function injectTrendingList(list, current) {
    const bottomTrendingList = document.getElementById('bottomTrendingList');
    if (!bottomTrendingList) return;
    if (!list || list.length === 0 || !current) {
        bottomTrendingList.innerHTML = `<p class="text-xs theme-muted">No trending stories yet.</p>`;
        return;
    }
    const trending = list.filter(s => s.slug !== current.slug).slice(0, 4);
    if (trending.length === 0) {
        bottomTrendingList.innerHTML = `<p class="text-xs theme-muted">Explore more articles from the homepage feed.</p>`;
        return;
    }
    bottomTrendingList.innerHTML = trending.map(s => `
        <a href="/${s.slug}" class="block space-y-0.5 group">
            <div class="flex items-center gap-2 theme-muted text-[11px] font-mono">
                <span>${s.author}</span>
                <span>•</span>
                <span>${s.date || 'Published'}</span>
            </div>
            <h4 class="font-bold theme-text group-hover:underline leading-snug">${s.title}</h4>
        </a>
    `).join('');
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

// 10. Load Live Story
async function loadLiveStory() {
    const client = window.supabaseClient;

    if (client && currentSlug) {
        try {
            const [artRes, setRes, singleArtRes] = await Promise.all([
                client.from('articles').select('*'),
                client.from('site_settings').select('*').eq('key', 'global_settings').single(),
                client.from('articles').select('*').eq('slug', currentSlug).single()
            ]);

            if (!setRes.error && setRes.data && setRes.data.value) {
                const parsed = typeof setRes.data.value === 'string' ? JSON.parse(setRes.data.value) : setRes.data.value;
                globalSettings = parsed;
                if (globalSettings.brand_color) {
                    document.documentElement.style.setProperty('--accent-green', globalSettings.brand_color);
                }
            }

            if (!singleArtRes.error && singleArtRes.data) {
                const found = singleArtRes.data;
                currentStory = {
                    id: found.id,
                    slug: found.slug,
                    title: found.title,
                    subtitle: found.subtitle,
                    author: found.author,
                    date: found.date,
                    readTime: found.read_time,
                    category: found.category,
                    tags: found.tags,
                    image: found.image,
                    imageAlt: found.image_alt,
                    bodyHtml: found.body_html,
                    status: found.status
                };
            }

            if (!artRes.error && artRes.data) {
                mediumStories = artRes.data.map(item => ({
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
                    bodyHtml: item.body_html,
                    status: item.status
                }));
            }

            renderStoryDetails(currentStory);
            injectRelatedStories(mediumStories, currentStory);
            injectTrendingList(mediumStories, currentStory);
            renderPostCategories(globalSettings.categories || []);
            return;
        } catch (e) {
            console.warn("Supabase fetch failed on post:", e);
        }
    }

    renderStoryDetails(null);
}

// Initial Load
loadLiveStory();

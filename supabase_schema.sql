-- ================================================================
-- SUPABASE COMPLETE CLEAN RESET SCRIPT (ZERO DUMMY DATA)
-- Run this in Supabase -> SQL Editor -> Click 'Run'
-- ================================================================

-- 1. DROP EXISTING TABLES AND POLICIES CLEANLY
DROP TABLE IF EXISTS public.articles CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.subscribers CASCADE;

-- 2. CREATE CLEAN ARTICLES TABLE
CREATE TABLE public.articles (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    author TEXT NOT NULL,
    publication TEXT DEFAULT 'Medium',
    author_initials TEXT DEFAULT 'AU',
    date TEXT,
    read_time TEXT DEFAULT '5 min read',
    category TEXT DEFAULT 'general',
    tags TEXT,
    is_member INTEGER DEFAULT 0,
    image TEXT,
    image_alt TEXT,
    body_html TEXT NOT NULL,
    status TEXT DEFAULT 'published',
    meta_title TEXT,
    meta_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CREATE CLEAN SITE SETTINGS TABLE
CREATE TABLE public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CREATE CLEAN SUBSCRIBERS TABLE
CREATE TABLE public.subscribers (
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- 6. SETUP PUBLIC READ & WRITE POLICIES (PERFECT FOR SERVERLESS VERCEL)
CREATE POLICY "Allow public read on articles" 
ON public.articles FOR SELECT USING (true);

CREATE POLICY "Allow public insert/update/delete on articles" 
ON public.articles FOR ALL USING (true);

CREATE POLICY "Allow public read on site_settings" 
ON public.site_settings FOR SELECT USING (true);

CREATE POLICY "Allow public write on site_settings" 
ON public.site_settings FOR ALL USING (true);

CREATE POLICY "Allow public insert on subscribers" 
ON public.subscribers FOR INSERT WITH CHECK (true);

-- 7. INSERT DEFAULT CLEAN SITE SETTINGS (EMPTY CATEGORIES & CLEAN BRANDING)
INSERT INTO public.site_settings (key, value) VALUES (
    'global_settings',
    '{
        "site_name": "Medium",
        "site_tagline": "Where good ideas find you.",
        "footer_copyright": "© 2026 Medium. All rights reserved.",
        "contact_email": "",
        "brand_color": "#1a8917",
        "animations_enabled": true,
        "hero": {
            "enabled": true,
            "headline": "Stay curious.",
            "subtitle": "Discover stories, thinking, and expertise from writers.",
            "bg_image": ""
        },
        "seo": {
            "meta_title": "Medium – Where good ideas find you.",
            "meta_description": "Discover stories, thinking, and expertise.",
            "focus_keywords": "",
            "canonical_url": "https://agentic-ai-beta-two.vercel.app/",
            "google_verification": ""
        },
        "monetization": {
            "adsense_enabled": false,
            "adsense_client_id": "",
            "header_ad_enabled": false,
            "in_feed_ad_enabled": false,
            "in_article_ad_enabled": false,
            "sidebar_ad_enabled": false,
            "ads_txt": ""
        },
        "analytics": {
            "ga_measurement_id": "",
            "custom_head_code": "",
            "custom_footer_code": ""
        },
        "categories": [],
        "nav_links": [
            { "label": "About Us", "url": "about.html" },
            { "label": "Contact", "url": "contact.html" },
            { "label": "Privacy", "url": "privacy.html" },
            { "label": "Terms", "url": "terms.html" },
            { "label": "Disclaimer", "url": "disclaimer.html" }
        ],
        "plugins": [
            { "id": "reading_progress", "name": "Reading Progress Bar", "enabled": true },
            { "id": "social_share", "name": "One-Click Social Share Bar", "enabled": true },
            { "id": "code_copy", "name": "Code Block One-Click Copy", "enabled": true },
            { "id": "image_lightbox", "name": "Responsive Image Zoom", "enabled": true }
        ]
    }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

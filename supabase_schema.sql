-- ================================================================
-- CLEAN SUPABASE SCHEMA FOR MEDIUM CMS (ZERO DUMMY DATA)
-- ================================================================

-- 1. Drop existing tables if needed
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS subscribers CASCADE;

-- 2. Create articles table
CREATE TABLE articles (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    author TEXT NOT NULL,
    publication TEXT DEFAULT 'Medium',
    author_initials TEXT DEFAULT 'AU',
    date TEXT NOT NULL,
    read_time TEXT DEFAULT '5 min read',
    category TEXT DEFAULT 'general',
    tags TEXT,
    is_member INT DEFAULT 0,
    image TEXT,
    image_alt TEXT,
    body_html TEXT NOT NULL,
    status TEXT DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create site_settings table
CREATE TABLE site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create subscribers table
CREATE TABLE subscribers (
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Insert clean default site settings (Empty categories, 0 dummy data)
INSERT INTO site_settings (key, value) VALUES (
    'global_settings',
    '{
        "site_name": "Medium",
        "site_tagline": "Where good ideas find you.",
        "footer_copyright": "© 2026 Medium. All rights reserved.",
        "brand_color": "#1a8917",
        "categories": [],
        "seo": {
            "meta_title": "Medium – Where good ideas find you.",
            "meta_description": "Discover stories, thinking, and expertise.",
            "canonical_url": ""
        },
        "monetization": {
            "adsense_client_id": "",
            "ads_txt": ""
        }
    }'::jsonb
);

-- 6. Enable Row Level Security (RLS) & Public Access Policies
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Articles" ON articles FOR SELECT USING (true);
CREATE POLICY "Public Write Articles" ON articles FOR ALL USING (true);

CREATE POLICY "Public Read Settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public Write Settings" ON site_settings FOR ALL USING (true);

CREATE POLICY "Public Insert Subscribers" ON subscribers FOR ALL USING (true);

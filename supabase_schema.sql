-- ================================================================
-- MEDIUM CLOUD CMS - SUPABASE POSTGRESQL INITIALIZATION SCHEMA
-- Run this script inside your Supabase Project -> SQL Editor -> Run
-- ================================================================

-- 1. Create Articles Table
CREATE TABLE IF NOT EXISTS public.articles (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    author TEXT NOT NULL,
    publication TEXT DEFAULT 'Synapse Journal',
    author_initials TEXT DEFAULT 'AU',
    date TEXT,
    read_time TEXT DEFAULT '5 min read',
    category TEXT DEFAULT 'engineering',
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

-- 2. Create Site Settings Table
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Subscribers Table
CREATE TABLE IF NOT EXISTS public.subscribers (
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) & Public Read Access
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public articles are viewable by everyone" 
ON public.articles FOR SELECT USING (true);

CREATE POLICY "Public settings are viewable by everyone" 
ON public.site_settings FOR SELECT USING (true);

CREATE POLICY "Anyone can insert subscriber" 
ON public.subscribers FOR INSERT WITH CHECK (true);

-- Allow authenticated/service role full access
CREATE POLICY "Full access to authenticated users" 
ON public.articles FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Full access to site_settings" 
ON public.site_settings FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

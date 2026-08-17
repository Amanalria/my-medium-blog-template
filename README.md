# 🚀 Medium CMS Studio Pro – High Performance Blog Template

An authentic, ultra-fast, Medium-style publishing platform and content management system built with **Pure HTML5, Tailwind CSS, and Vanilla JavaScript**, powered by **Vercel Edge CDN** and **Supabase PostgreSQL**.

---

## 🌟 Key Features

* **⚡ Ultra Fast (Speed 98+)**: 100% Vanilla JS, zero heavy framework overhead, instant page loads.
* **✍️ WordPress Classic Editor**: Rich text WYSIWYG editor with Heading 2/3, Blockquotes, Preformatted Code Blocks, Lists, and Hyperlinks.
* **⚡ 5-Step Custom KB WebP Studio**: Automatic in-browser HTML5 Canvas image compression down to custom target file size (5 KB to 300 KB) with image renaming before upload.
* **🔗 Clean Permalinks**: Native `domain.com/post-name` routing via `vercel.json`.
* **🔍 Complete SEO Suite**: Dynamic OpenGraph tags, Google JSON-LD Article Schema, canonical URLs, `sitemap.xml`, and `robots.txt`.
* **💰 Google AdSense Ready**: Native header, in-feed, mid-article, and sidebar ad slots with live `ads.txt` compliance file.
* **🏷️ Categories & Tags Manager**: 1-click custom topic creator, tag manager, and sidebar synchronization.
* **🤖 AI Article Synthesizer**: Instant SEO-optimized technical draft generator.
* **🌓 Light / Dark Modes**: Smooth transitions with system preference detection.

---

## 📁 Repository Structure

```
├── index.html            # Public Homepage & Story Feed
├── post.html             # Story Reader Template
├── admin.html            # WordPress Classic Editor & CMS Studio
├── about.html            # About Us Page
├── contact.html          # Contact Us Page
├── privacy.html          # Privacy Policy Page
├── terms.html            # Terms of Service Page
├── disclaimer.html       # Disclaimer Page
├── app.js                # Feed Rendering & Settings Sync Engine
├── post.js               # Article Reader & JSON-LD Schema Engine
├── admin.js              # CMS Studio, WebP Compressor & CRUD Logic
├── supabase-client.js    # Supabase Free Cloud PostgreSQL Connector
├── styles.css            # Custom Styling & Spring Animations
├── sitemap.xml           # Search Engine XML Sitemap
├── robots.txt            # Search Engine Directives
├── ads.txt               # Google AdSense Publisher Verification
└── vercel.json           # Vercel Edge Clean URL Rewrites (/:slug -> /post.html)
```

---

## 🚀 1-Click Deployment (Vercel + Supabase)

### 1. Database Setup (Supabase)
1. Create a free project on [supabase.com](https://supabase.com).
2. In SQL Editor, run the provided database schema query.
3. Copy your **Project URL** and **Anon API Key** into `supabase-client.js`.

### 2. Host on Vercel
1. Import this repository into [vercel.com](https://vercel.com).
2. Click **Deploy**.
3. (Optional) Connect your custom domain in Vercel Settings -> Domains.

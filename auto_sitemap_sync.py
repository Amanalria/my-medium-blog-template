#!/usr/bin/env python3
"""
Automated Perpetual Sitemap Engine for Hive Cloud (hivecloud.in)
- Guaranteed Additive Merging: Existing published URLs and static pages are NEVER deleted.
- Full Static Page Coverage: Home, About Us, Contact Us, Privacy Policy, Terms & Conditions, Disclaimer.
- Automatic Ingestion: Reads articles_data.json and Supabase 'articles' table.
- Strict Exclusions: Permanently blocks /articles, /articles/, /aman, and admin paths.
- Compliant XML Output: Generates valid sitemaps.org 0.9 XML.
"""

import os
import re
import json
import xml.etree.ElementTree as ET
from datetime import datetime
import urllib.request

REPO_DIR = "/root/ai-coding-agent-engine/storage/synapse_blog/frontend"
SITEMAP_PATH = os.path.join(REPO_DIR, "sitemap.xml")
JSON_PATH = os.path.join(REPO_DIR, "articles_data.json")

SUPABASE_URL = "https://okpyphrqudeeoboesdzz.supabase.co/rest/v1/articles?select=slug,status,date"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rcHlwaHJxdWRlZW9ib2VzZHp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NjYxNDUsImV4cCI6MjEwMjU0MjE0NX0.jyg2OqFSx_qtfkkPHU0E_VINxJgtYSK_70UpFLd_X2k"

# Base default pages (Always present in sitemap)
BASE_PAGES = [
    {"loc": "https://hivecloud.in/", "priority": "1.0", "changefreq": "daily"},
    {"loc": "https://hivecloud.in/about", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "https://hivecloud.in/contact", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "https://hivecloud.in/privacy", "priority": "0.5", "changefreq": "monthly"},
    {"loc": "https://hivecloud.in/terms", "priority": "0.5", "changefreq": "monthly"},
    {"loc": "https://hivecloud.in/disclaimer", "priority": "0.5", "changefreq": "monthly"},
]

# Explicitly Forbidden URLs (Must never appear in sitemap)
BLOCKED_PATTERNS = [
    r"^https?://[^/]+/articles/?$",
    r"^https?://[^/]+/aman/?.*$",
    r"^https?://[^/]+/admin/?.*$",
]

def is_blocked(url):
    for pattern in BLOCKED_PATTERNS:
        if re.match(pattern, url.strip()):
            return True
    return False

def parse_existing_sitemap():
    url_map = {}
    if not os.path.exists(SITEMAP_PATH):
        return url_map
    
    try:
        tree = ET.parse(SITEMAP_PATH)
        root = tree.getroot()
        ns = {"ns": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        
        for url_elem in root.findall("ns:url", ns) or root.findall("url"):
            loc_elem = url_elem.find("ns:loc", ns) or url_elem.find("loc")
            if loc_elem is not None and loc_elem.text:
                loc = loc_elem.text.strip()
                if is_blocked(loc):
                    continue
                
                lastmod_elem = url_elem.find("ns:lastmod", ns) or url_elem.find("lastmod")
                changefreq_elem = url_elem.find("ns:changefreq", ns) or url_elem.find("changefreq")
                priority_elem = url_elem.find("ns:priority", ns) or url_elem.find("priority")
                
                url_map[loc] = {
                    "loc": loc,
                    "lastmod": lastmod_elem.text.strip() if lastmod_elem is not None and lastmod_elem.text else datetime.now().strftime("%Y-%m-%d"),
                    "changefreq": changefreq_elem.text.strip() if changefreq_elem is not None and changefreq_elem.text else "weekly",
                    "priority": priority_elem.text.strip() if priority_elem is not None and priority_elem.text else "0.8"
                }
    except Exception as e:
        print(f"⚠️ Warning reading existing sitemap: {e}")
    
    return url_map

def sync_sitemap():
    print("🔄 Starting Automated Sitemap Synchronization with all static & article pages...")
    url_map = parse_existing_sitemap()
    today = datetime.now().strftime("%Y-%m-%d")

    # 1. Add/Preserve All Core Static Pages
    for bp in BASE_PAGES:
        loc = bp["loc"]
        if loc not in url_map:
            url_map[loc] = {
                "loc": loc,
                "lastmod": today,
                "changefreq": bp["changefreq"],
                "priority": bp["priority"]
            }
        else:
            # Keep official priority/changefreq
            url_map[loc]["priority"] = bp["priority"]
            url_map[loc]["changefreq"] = bp["changefreq"]

    # 2. Ingest from local articles_data.json
    if os.path.exists(JSON_PATH):
        try:
            with open(JSON_PATH, "r", encoding="utf-8") as f:
                articles = json.load(f)
                for art in articles:
                    slug = art.get("slug", "").strip()
                    if slug:
                        url = f"https://hivecloud.in/{slug}"
                        if not is_blocked(url):
                            if url not in url_map:
                                url_map[url] = {
                                    "loc": url,
                                    "lastmod": today,
                                    "changefreq": "weekly",
                                    "priority": "0.8"
                                }
        except Exception as e:
            print(f"⚠️ Error reading {JSON_PATH}: {e}")

    # 3. Ingest from Supabase Database
    try:
        headers = {
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}",
            "Content-Type": "application/json"
        }
        req = urllib.request.Request(SUPABASE_URL, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            for item in data:
                if item.get("status") == "published" or not item.get("status"):
                    slug = item.get("slug", "").strip()
                    if slug:
                        url = f"https://hivecloud.in/{slug}"
                        if not is_blocked(url):
                            if url not in url_map:
                                url_map[url] = {
                                    "loc": url,
                                    "lastmod": today,
                                    "changefreq": "weekly",
                                    "priority": "0.8"
                                }
    except Exception as e:
        print(f"⚠️ Supabase sitemap sync note: {e}")

    # 4. Generate clean, organized sitemap.xml
    # Order: Home -> Main Static Pages -> Legal Pages -> Articles
    order_map = {
        "https://hivecloud.in/": 0,
        "https://hivecloud.in/about": 1,
        "https://hivecloud.in/contact": 2,
        "https://hivecloud.in/privacy": 3,
        "https://hivecloud.in/terms": 4,
        "https://hivecloud.in/disclaimer": 5,
    }

    def sort_key(item):
        loc = item["loc"]
        if loc in order_map:
            return (0, order_map[loc])
        return (1, loc)

    sorted_urls = sorted(url_map.values(), key=sort_key)

    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]

    for entry in sorted_urls:
        if is_blocked(entry["loc"]):
            continue
        xml_lines.append('  <url>')
        xml_lines.append(f'    <loc>{entry["loc"]}</loc>')
        xml_lines.append(f'    <lastmod>{entry.get("lastmod", today)}</lastmod>')
        xml_lines.append(f'    <changefreq>{entry.get("changefreq", "weekly")}</changefreq>')
        xml_lines.append(f'    <priority>{entry.get("priority", "0.8")}</priority>')
        xml_lines.append('  </url>')

    xml_lines.append('</urlset>\n')

    with open(SITEMAP_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(xml_lines))

    print(f"✅ Successfully updated {len(sorted_urls)} URLs in {SITEMAP_PATH}")
    print("📋 Included Static Pages:")
    for bp in BASE_PAGES:
        print(f"   • {bp['loc']} (priority: {bp['priority']})")
    print("🔒 Blocked URLs: /articles, /articles/, /aman")
    return len(sorted_urls)

if __name__ == "__main__":
    sync_sitemap()

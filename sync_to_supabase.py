#!/usr/bin/env python3
"""
Sync New August 2026 Articles to Supabase Database for Admin Panel (hivecloud.in/aman)
"""

import urllib.request
import json
import time

SUPABASE_URL = "https://okpyphrqudeeoboesdzz.supabase.co/rest/v1/articles"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rcHlwaHJxdWRlZW9ib2VzZHp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NjYxNDUsImV4cCI6MjEwMjU0MjE0NX0.jyg2OqFSx_qtfkkPHU0E_VINxJgtYSK_70UpFLd_X2k"

with open("/root/ai-coding-agent-engine/storage/synapse_blog/frontend/articles_data.json", "r", encoding="utf-8") as f:
    all_articles = json.load(f)

target_slugs = ["agentic-ai-news-august", "ai-agents-news", "latest-agentic-ai-news-august"]
new_articles_to_sync = [a for a in all_articles if a.get("slug") in target_slugs]

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

for a in new_articles_to_sync:
    ts = int(time.time())
    payload = {
        "id": f"art_aug_news_{a['slug'].replace('-', '_')}",
        "slug": a["slug"],
        "title": a["title"],
        "subtitle": a.get("subtitle", ""),
        "author": a.get("author", "Aman Alria"),
        "publication": "Medium",
        "author_initials": "AA",
        "date": "Aug 18, 2026",
        "read_time": a.get("readTime", "8 min read"),
        "category": "ai",
        "tags": a.get("tags", "agentic-ai, ai-agents, ai-news"),
        "is_member": 0,
        "image": "",
        "image_alt": a["title"],
        "body_html": a["content"],
        "status": "published"
    }

    req = urllib.request.Request(
        SUPABASE_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            print(f"✅ Synced to Supabase Admin: {a['title']} (/{a['slug']}) -> Status {resp.status}")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        print(f"⚠️ HTTP Error syncing {a['slug']}: {e.code} - {err_body}")
    except Exception as e:
        print(f"⚠️ Error syncing {a['slug']}: {e}")

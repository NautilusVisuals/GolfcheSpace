#!/usr/bin/env python3
"""Build the static site and exclude editable source content from the public output."""
from pathlib import Path
import html
import json
import re
import shutil
import subprocess
import sys
import os
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"


def main():
    # Rebuild the current catalogues before copying, so diary drafts never enter public assets.
    result = subprocess.run([sys.executable, str(ROOT / "build_catalogs.py")], cwd=ROOT)
    if result.returncode:
        return result.returncode
    if DIST.resolve().parent != ROOT.resolve():
        raise RuntimeError("Refusing to clean an unexpected build directory")
    if DIST.exists():
        shutil.rmtree(DIST)
    ignored = shutil.ignore_patterns(
        ".git", ".github", ".codex", ".aws", ".codex-migration-checkpoint", "dist",
        "__pycache__", "*.pyc", "*.py", "*.md", ".gitignore", ".env", ".env.*",
        ".dev.vars", "*.env", "*.pem", "*.key", "wrangler.toml",
        "works", "templates", "docs", "screenshots",
        "_content-backup",
    )
    shutil.copytree(ROOT, DIST, ignore=ignored)
    posts = json.loads((ROOT / "assets" / "diary" / "catalog.js").read_text(encoding="utf-8").split("=", 1)[1].strip().rstrip(";"))
    generate_post_pages(posts)
    generate_clean_url_pages()
    update_discovery_files(posts)
    prepare_github_pages()
    print("Built public site in dist/ (works/ source content excluded)")
    return 0


def prepare_github_pages():
    """Make generated output work at GitHub Pages' repository subpath."""
    (DIST / ".nojekyll").write_text("", encoding="utf-8")
    repository = os.environ.get("GITHUB_REPOSITORY", "").strip()
    if not repository or "/" not in repository:
        return
    owner, name = repository.split("/", 1)
    configured_url = os.environ.get("GITHUB_PAGES_URL", "").strip().rstrip("/")
    if configured_url:
        parsed_url = urlsplit(configured_url)
        site_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path.rstrip('/')}"
        base_path = parsed_url.path.rstrip("/")
    else:
        user_site = name.lower() == f"{owner}.github.io".lower()
        base_path = "" if user_site else f"/{name}"
        site_url = f"https://{owner}.github.io{base_path}"
    for path in DIST.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in (".html", ".xml", ".txt"):
            continue
        text = path.read_text(encoding="utf-8")
        text = text.replace("https://example.com", site_url)
        if base_path:
            text = re.sub(r'(["\'])/(assets|diary)(?=/)', rf'\1{base_path}/\2', text)
            text = text.replace('href="/"', f'href="{base_path}/"')
        path.write_text(text, encoding="utf-8")
def generate_clean_url_pages():
    """Provide index.html routes for pages whose canonical URLs omit .html."""
    for section in ("thinking", "lab"):
        for source in sorted((DIST / section).glob("*.html")):
            route = source.with_suffix("") / "index.html"
            route.parent.mkdir(parents=True, exist_ok=True)
            document = source.read_text(encoding="utf-8")
            document = document.replace('="../', '="../../')
            route.write_text(document, encoding="utf-8")


def generate_post_pages(posts):
    template = (DIST / "diary.html").read_text(encoding="utf-8")
    output = DIST / "diary"
    output.mkdir(parents=True, exist_ok=True)
    for post in posts:
        slug = post["slug"]
        title = str(post["title"]).strip()
        description = str(post.get("excerpt") or title).strip()
        canonical = f"https://example.com/diary/{slug}.html"
        share_image = post.get("images", [{}])[0].get("src") if post.get("images") else "assets/og/home.jpg"
        document = template.replace('<title>Dear Diary — Golfche Space</title>', f"<title>{html.escape(title)} — Dear Diary · Golfche Space</title>")
        document = document.replace('<meta name="description" content="Work-in-progress renders, character updates, art and notes from Golfche Space.">', f'<meta name="description" content="{html.escape(description, quote=True)}">')
        document = document.replace('<meta property="og:title" content="Dear Diary — Golfche Space">', f'<meta property="og:title" content="{html.escape(title, quote=True)} — Dear Diary · Golfche Space">')
        document = document.replace('<meta property="og:description" content="Work-in-progress renders, character updates, art and notes from Golfche Space.">', f'<meta property="og:description" content="{html.escape(description, quote=True)}">')
        document = document.replace('<meta property="og:type" content="website">', '<meta property="og:type" content="article">')
        document = document.replace('https://example.com/diary.html', canonical)
        document = document.replace('https://example.com/assets/og/home.jpg', f"https://example.com/{share_image}")
        document = document.replace('<body data-page="diary">', f'<body data-page="diary" data-post="{html.escape(slug, quote=True)}">')
        document = document.replace('<h1 class="sec-title" id="diary-h">Dear Diary</h1>', '<p class="sec-title" id="diary-h">Dear Diary</p>')
        document = document.replace('<head>', '<head>\n<base href="/">', 1)
        schema = {
            "@context": "https://schema.org", "@type": "BlogPosting", "@id": canonical + "#post",
            "mainEntityOfPage": canonical, "headline": title, "description": description,
            "image": "https://example.com/" + share_image, "datePublished": post["date"], "dateModified": post["date"],
            "author": {"@type": "Person", "name": "Golfche"}, "publisher": {"@type": "Person", "name": "Golfche"}
        }
        document = re.sub(r'<script type="application/ld\+json">[\s\S]*?</script>', '<script type="application/ld+json">\n' + json.dumps(schema, ensure_ascii=False, indent=2) + '\n</script>', document, count=1)
        (output / f"{slug}.html").write_text(document, encoding="utf-8")


def update_discovery_files(posts):
    sitemap_path = ROOT / "sitemap.xml"
    sitemap = sitemap_path.read_text(encoding="utf-8")
    sitemap = re.sub(r"\n?  <!-- BEGIN diary posts -->[\s\S]*?  <!-- END diary posts -->", "", sitemap)
    lines = ["  <!-- BEGIN diary posts -->"]
    for post in posts:
        lines.append(f"  <url><loc>https://example.com/diary/{html.escape(post['slug'])}.html</loc><lastmod>{post['date']}</lastmod></url>")
    lines.append("  <!-- END diary posts -->")
    sitemap = sitemap.replace("</urlset>", "\n" + "\n".join(lines) + "\n</urlset>")
    sitemap_path.write_text(sitemap, encoding="utf-8")
    out_map = DIST / "sitemap.xml"
    out_map.write_text(sitemap, encoding="utf-8")

    llms_path = ROOT / "llms.txt"
    llms = llms_path.read_text(encoding="utf-8")
    llms = re.sub(r"\n<!-- BEGIN diary posts -->[\s\S]*?<!-- END diary posts -->", "", llms)
    section = ["<!-- BEGIN diary posts -->"]
    section.extend(f"  - {str(post['title']).replace(chr(10), ' ').strip()}: /diary/{post['slug']}.html" for post in posts)
    section.append("<!-- END diary posts -->")
    marker = "- Stories: /stories.html"
    diary_marker = "- Dear Diary: /diary.html"
    if diary_marker not in llms and marker in llms:
        llms = llms.replace(marker, marker + "\n" + diary_marker)
    if diary_marker in llms:
        llms = llms.replace(diary_marker, diary_marker + "\n" + "\n".join(section))
    llms_path.write_text(llms, encoding="utf-8")
    (DIST / "llms.txt").write_text(llms, encoding="utf-8")


if __name__ == "__main__":
    raise SystemExit(main())

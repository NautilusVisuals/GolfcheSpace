#!/usr/bin/env python3
"""Build the static site's three JavaScript catalogues from works/**/*.md."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from datetime import date as date_type

ROOT = Path(__file__).resolve().parent
READING_WORDS_PER_MINUTE = 200
SECTIONS = {
    "artworks": ("GolfcheArtworks", "title", ("thumbnail", "fullImage")),
    "products": ("GolfcheProducts", "name", ("thumbnail", "mainImage")),
    "stories": ("GolfcheStories", "title", ("cover",)),
}

DIARY_TAGS = {"WIP", "Behind the Scenes", "Character Update", "Art", "Writing", "Random"}


def scalar(raw: str):
    raw = raw.strip()
    if not raw:
        return None
    if raw.startswith(('"', "'", "[", "{")) or raw in ("true", "false", "null") or re.fullmatch(r"-?\d+(?:\.\d+)?", raw):
        if raw.startswith("'") and raw.endswith("'"):
            return raw[1:-1].replace("''", "'")
        try:
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            raise ValueError(f"invalid YAML value {raw!r}: {exc.msg}") from exc
    return raw


def parse_yaml(text: str):
    """Parse the intentionally small safe YAML subset used by these content files."""
    source_lines = text.splitlines()
    expanded = []
    cursor = 0
    while cursor < len(source_lines):
        line = source_lines[cursor]
        literal = re.match(r"^(\s*)([A-Za-z][A-Za-z0-9_-]*):\s*[|>]\s*$", line)
        if not literal:
            expanded.append(line)
            cursor += 1
            continue
        parent_indent = len(literal.group(1))
        cursor += 1
        body = []
        while cursor < len(source_lines):
            candidate = source_lines[cursor]
            if candidate.strip() and len(candidate) - len(candidate.lstrip(" ")) <= parent_indent:
                break
            body.append(candidate[parent_indent + 2:] if candidate.strip() else "")
            cursor += 1
        expanded.append(literal.group(1) + literal.group(2) + ": " + json.dumps("\n".join(body), ensure_ascii=False))
    text = "\n".join(expanded)
    lines = []
    for number, line in enumerate(text.splitlines(), 1):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if "\t" in line[:len(line) - len(line.lstrip())]:
            raise ValueError(f"line {number}: indentation must use spaces")
        indent = len(line) - len(line.lstrip(" "))
        lines.append((indent, line.strip(), number))

    def block(i, indent):
        is_list = lines[i][1] == "-" or lines[i][1].startswith("- ")
        result = [] if is_list else {}
        while i < len(lines) and lines[i][0] == indent:
            _, content, number = lines[i]
            if is_list:
                if not (content == "-" or content.startswith("- ")):
                    raise ValueError(f"line {number}: expected a list item")
                rest = content[1:].strip()
                i += 1
                if not rest:
                    if i < len(lines) and lines[i][0] > indent:
                        value, i = block(i, lines[i][0])
                    else:
                        value = None
                elif ":" in rest and not rest.startswith(("'", '"', "{", "[")):
                    key, raw = rest.split(":", 1)
                    obj = {key.strip(): scalar(raw)}
                    if i < len(lines) and lines[i][0] > indent:
                        extra, i = block(i, lines[i][0])
                        if not isinstance(extra, dict):
                            raise ValueError(f"line {number}: expected fields under list item")
                        obj.update(extra)
                    value = obj
                else:
                    value = scalar(rest)
                result.append(value)
            else:
                if content.startswith("-") or ":" not in content:
                    raise ValueError(f"line {number}: expected key: value")
                key, raw = content.split(":", 1)
                key = key.strip()
                if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]*", key):
                    raise ValueError(f"line {number}: invalid field name {key!r}")
                if key in result:
                    raise ValueError(f"line {number}: duplicate field {key!r}")
                i += 1
                if raw.strip():
                    result[key] = scalar(raw)
                elif i < len(lines) and lines[i][0] > indent:
                    result[key], i = block(i, lines[i][0])
                else:
                    result[key] = None
        return result, i

    if not lines:
        return {}
    value, end = block(0, lines[0][0])
    if end != len(lines):
        raise ValueError("invalid indentation")
    return value


def read_item(path: Path, section: str):
    raw = path.read_text(encoding="utf-8")
    if not raw.startswith("---\n") and not raw.startswith("---\r\n"):
        raise ValueError("missing opening --- frontmatter delimiter")
    match = re.search(r"\r?\n---\s*(?:\r?\n|$)", raw[4:])
    if not match:
        raise ValueError("missing closing --- frontmatter delimiter")
    data = parse_yaml(raw[4:4 + match.start()])
    if not isinstance(data, dict):
        raise ValueError("frontmatter must be a mapping")
    _, title_field, required = SECTIONS[section]
    for key in ("id", title_field, "order", *required):
        if data.get(key) in (None, "", []):
            raise ValueError(f"missing required field {key!r}")
    for key in required:
        image = data[key]
        if not isinstance(image, dict) or not image.get("src"):
            raise ValueError(f"{key} must include a src image path")
    if not isinstance(data["order"], (int, float)) or isinstance(data["order"], bool):
        raise ValueError("order must be a number")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", str(data["id"])):
        raise ValueError("id must use lowercase letters, numbers, and hyphens")
    if section in ("products", "stories") and not data.get("slug"):
        raise ValueError("missing required field 'slug'")
    if section == "stories" and data.get("type") not in ("fanfiction", "comic"):
        raise ValueError("story type must be fanfiction or comic")
    if section == "stories":
        story_text = data.get("storyText") or ""
        chapters = data.get("chapters") or []
        chapter_text = " ".join(str(chapter.get("content") or "") for chapter in chapters if isinstance(chapter, dict))
        words = re.findall(r"\b[\w’'-]+\b", str(story_text) + " " + chapter_text, re.UNICODE)
        data["readingTime"] = max(1, (len(words) + READING_WORDS_PER_MINUTE - 1) // READING_WORDS_PER_MINUTE)
        data["readingWordsPerMinute"] = READING_WORDS_PER_MINUTE
    if section == "products":
        price = data.get("price")
        sale = data.get("salePrice")
        for key, val in (("price", price), ("salePrice", sale)):
            if val is not None and (not isinstance(val, dict) or not isinstance(val.get("amount"), (int, float)) or not re.fullmatch(r"[A-Z]{3}", str(val.get("currency", "")))):
                raise ValueError(f"{key} must be null or have numeric amount and 3-letter currency")
    for image in all_image_objects(data):
        src = image.get("src")
        if not isinstance(src, str) or not src:
            raise ValueError("image entries need a src path")
        for dimension in ("width", "height"):
            if not isinstance(image.get(dimension), (int, float)) or image[dimension] <= 0:
                raise ValueError(f"image {src!r} needs a positive numeric {dimension}")
        if src.startswith("/") or re.match(r"^[a-z]+://", src, re.I) or "\\" in src:
            raise ValueError(f"image path must be a relative public asset path: {src}")
        resolved = (ROOT / src).resolve()
        if ROOT.resolve() not in resolved.parents or not resolved.is_file():
            raise ValueError(f"image path does not exist inside the site: {src}")
    return data


def all_image_objects(value):
    if isinstance(value, dict):
        if "src" in value:
            yield value
        for child in value.values():
            yield from all_image_objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from all_image_objects(child)


def build():
    errors = []
    outputs = {}
    for section, (global_name, _, _) in SECTIONS.items():
        folder = ROOT / "works" / section
        entries = []
        ids = set()
        slugs = set()
        if folder.exists():
            for path in sorted(folder.glob("*.md")):
                try:
                    item = read_item(path, section)
                    key = item.get("slug", item["id"])
                    if item["id"] in ids or key in slugs:
                        raise ValueError("duplicate id or slug in this section")
                    ids.add(item["id"])
                    slugs.add(key)
                    entries.append(item)
                except (ValueError, OSError) as exc:
                    errors.append(f"{path.relative_to(ROOT)}: {exc}")
        entries.sort(key=lambda item: (item["order"], item["id"]))
        outputs[section] = f"window.{global_name} = {json.dumps(entries, ensure_ascii=False, indent=2)};\n"
    if errors:
        print("Catalogue build failed:", file=sys.stderr)
        print("\n".join(f"  - {error}" for error in errors), file=sys.stderr)
        return 1
    for section, source in outputs.items():
        target = ROOT / "assets" / section / "catalog.js"
        target.write_text(source, encoding="utf-8")
        print(f"Built {target.relative_to(ROOT)}")
    diary, diary_errors = build_diary()
    if diary_errors:
        print("Diary build failed:", file=sys.stderr)
        print("\n".join(f"  - {error}" for error in diary_errors), file=sys.stderr)
        return 1
    target = ROOT / "assets" / "diary" / "catalog.js"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(f"window.GolfcheDiary = {json.dumps(diary, ensure_ascii=False, indent=2)};\n", encoding="utf-8")
    print(f"Built {target.relative_to(ROOT)} ({len(diary)} published posts)")
    return 0


def build_diary():
    folder = ROOT / "works" / "diary"
    entries, errors, slugs = [], [], set()
    for path in sorted(folder.glob("*.md")) if folder.exists() else []:
        try:
            raw = path.read_text(encoding="utf-8")
            match = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n(.*)$", raw, re.S)
            if not match:
                raise ValueError("expected YAML frontmatter followed by a Markdown body")
            data = parse_yaml(match.group(1))
            if not isinstance(data, dict):
                raise ValueError("frontmatter must be a mapping")
            slug = data.get("slug")
            if not isinstance(slug, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
                raise ValueError("slug must use lowercase letters, numbers, and hyphens")
            if slug in slugs:
                raise ValueError(f"duplicate slug {slug!r}")
            slugs.add(slug)
            for key in ("title", "date", "tags", "images", "published", "commentsEnabled"):
                if key not in data:
                    raise ValueError(f"missing required field {key!r}")
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(data["date"])):
                raise ValueError("date must use YYYY-MM-DD")
            try:
                date_type.fromisoformat(str(data["date"]))
            except ValueError:
                raise ValueError("date must be a real calendar date")
            if not isinstance(data["published"], bool) or not isinstance(data["commentsEnabled"], bool):
                raise ValueError("published and commentsEnabled must be true or false")
            tags = data.get("tags") or []
            if not isinstance(tags, list) or any(tag not in DIARY_TAGS for tag in tags):
                raise ValueError("tags must be a list of supported Diary tags")
            images = data.get("images") or []
            if not isinstance(images, list):
                raise ValueError("images must be a list")
            for image in images:
                if not isinstance(image, dict) or not image.get("src") or image.get("alt") is None:
                    raise ValueError("each image needs src and alt (alt may be empty for decorative images)")
                for dimension in ("width", "height"):
                    if not isinstance(image.get(dimension), (int, float)) or image[dimension] <= 0:
                        raise ValueError(f"image {image.get('src')!r} needs a positive {dimension}")
                src = image["src"]
                if src.startswith("/") or re.match(r"^[a-z]+://", src, re.I) or "\\" in src:
                    raise ValueError(f"image path must be site-relative: {src}")
                resolved = (ROOT / src).resolve()
                if ROOT.resolve() not in resolved.parents or not resolved.is_file():
                    raise ValueError(f"image does not exist: {src}")
            data["body"] = match.group(2).strip()
            data["relatedLinks"] = data.get("relatedLinks") or []
            if any(not isinstance(link, dict) or not link.get("title") or not re.match(r"^(https?://|/|[a-z0-9_-]+/)", str(link.get("url", "")), re.I) for link in data["relatedLinks"]):
                raise ValueError("relatedLinks entries need a title and a safe relative or HTTPS URL")
            if data["published"]:
                entries.append(data)
        except (ValueError, OSError, TypeError) as exc:
            errors.append(f"{path.relative_to(ROOT)}: {exc}")
    entries.sort(key=lambda item: (item["date"], item["slug"]), reverse=True)
    return entries, errors


if __name__ == "__main__":
    raise SystemExit(build())


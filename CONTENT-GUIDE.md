# Add products, artworks, and stories

Content for the three catalogues lives in individual Markdown files. The website's page layout, cart, product detail view, artwork lightbox and Stories view continue to use the existing page scripts.

## Quick workflow

1. Copy the right `templates/<type>-template.md` file into that same section folder.
2. Rename it to a unique item name, for example `my-artwork.md` or `new-character.md`.
3. Edit the values between the `---` lines. Keep indentation and field names as shown in the template.
4. Put public images in `assets/img/artworks/`, `assets/img/products/` or `assets/img/stories/`. Update each `src` to its path from the site root and enter its real pixel width and height.
5. From the project folder run `py build_catalogs.py` (Windows). If `py` is unavailable, use `python build_catalogs.py`.
6. Preview with `py -m http.server 8000` and open `http://localhost:8000/artworks.html`, `products.html` or `stories.html`. Stop the server with Ctrl+C.

The build reads actual `*.md` content files in `works/artworks/`, `works/products/` and `works/stories/`, checks required fields and image files, then writes the existing `assets/*/catalog.js` files. Templates live only in `templates/` and are not read as content. Run the build after adding or editing Markdown. Run it before publishing too. The static host does not discover Markdown at runtime.

The build uses Python's standard library and needs no package install. Errors name the file and field or image path to fix. Image paths must be site-relative public paths such as `assets/img/products/nyxi/cover.jpg`; do not use an absolute disk path. Do not put paid ZIP downloads in public `assets/` folders.

## Artworks

Copy `templates/artwork-template.md` to `works/artworks/my-artwork.md`. Required fields are `id`, `title`, `order`, `thumbnail` and `fullImage`. Set both image `src` values to the same file if you only have one image. Optional fields include caption, description, category, tags and featured. The square grid uses `thumbnail`; clicking opens `fullImage` in the current lightbox.

Complete example:

```yaml
---
id: moonlit-study
title: Moonlit Study
caption: A quiet moment beneath a violet sky.
description: A digital character portrait.
category: Illustration
tags:
  - portrait
  - night
thumbnail:
  src: assets/img/artworks/moonlit-study.jpg
  alt: Character portrait beneath a violet sky.
  width: 1200
  height: 1200
fullImage:
  src: assets/img/artworks/moonlit-study.jpg
  alt: Full-size character portrait beneath a violet sky.
  width: 1200
  height: 1200
order: 1
featured: true
---
```

## 3D products

Copy `templates/product-template.md` to `works/products/my-product.md`. Required fields are `id`, `slug`, `name`, `order`, `thumbnail` and `mainImage`. `images` is the additional gallery in order. Optional detail fields are `shortDescription`, `description`, `price`, `salePrice`, `category`, `badge`, `features`, `compatibility`, `compatibilityLabel`, `specifications`, `includes`, `installation` and `purchaseUrl`. Prices stay `null` until confirmed and use `{ "amount": 20.00, "currency": "EUR" }` when set. Badge may be `NEW`, `SALE` or `null`. Categories used by the current filters are `characters`, `bundles` and `other-assets`.

Complete example:

```yaml
---
id: sample-character
slug: sample-character
name: Sample Character
category: characters
badge: NEW
thumbnail:
  src: assets/img/products/sample-character/thumb.jpg
  alt: Sample Character catalogue preview.
  width: 1000
  height: 1000
mainImage:
  src: assets/img/products/sample-character/main.jpg
  alt: Sample Character full preview.
  width: 1600
  height: 1600
images:
  - src: assets/img/products/sample-character/detail.jpg
    alt: Close-up of Sample Character.
    width: 1600
    height: 1600
shortDescription: A short summary for the card.
description: A full description for the product detail page.
price: null
salePrice: null
compatibility: Works with the supported figure and software version.
compatibilityLabel: Example Figure
features:
  - Custom materials
  - Apply and remove presets
specifications:
  - {"name":"Format","value":"DAZ Studio assets"}
includes:
  - Character files and presets
installation: Install the files into the matching content library folders.
purchaseUrl: ""
order: 1
---
```

Keep product `slug` stable after publishing because it is used for the detail route and cart. Only add real product facts, prices and purchase links. Store downloadable ZIPs in private storage outside the website folder.

## Stories, comics and fanfiction

Each entry is a Markdown file in `works/stories/`, rendered by the existing Stories catalogue and shared detail route. The categories are All Stories, Comics, and Fanfiction (`type: comic` or `type: fanfiction`). Copy `templates/story-template.md` to a unique filename in `works/stories/`. Keep each entry's images in `assets/img/stories/<slug>/` and use site-relative paths with the images' actual pixel dimensions.

For a fanfiction entry, fill in the Markdown frontmatter fields in the template: `id`, `slug`, `title`, `fandom`, `type`, `cover`, `synopsis`, `genre`, `status`, `warnings`, `storyText`, `images`, `characters`, `lore`, optional `chapters`, `authorNotes`, and `order`. `storyText` and chapter `content` fields support multiline paragraphs and headings. Additional images go in `images`; character and lore entries can also include an image. They render on the same detail page.

Run `py build_catalogs.py` after adding or editing story Markdown. It checks public image paths and dimensions, generates `assets/stories/catalog.js`, and calculates `readingTime` from `storyText` plus chapter content at `READING_WORDS_PER_MINUTE` in `build_catalogs.py` (currently 200 words per minute). Synopsis, character notes, and lore are excluded. Preview with `py -m http.server 8000` and open `http://localhost:8000/stories.html`.

Comics keep using the existing `pages` list and shared detail page. Keep page images in reading order. The template includes the fields needed to start a fanfiction entry; fictional stories belong in Fanfiction, not Comics.

## Dear Diary

Diary posts are stored as Markdown in `works/diary/`. Copy `templates/diary-template.md` to `works/diary/<slug>.md`, fill in the frontmatter, and write the body as Markdown. Each image goes under `assets/img/diary/<slug>/` with a site-relative `src`, its true dimensions, descriptive alt text, and an optional caption. Tags supported by the template are WIP, Behind the Scenes, Character Update, Art, Writing and Random. Posts sort newest first by `date`.

Draft posts must use `published: false`. The build emits only published entries, generates a standalone page for each, and excludes all `works/` sources from `dist/`. Keep the connected Git repository private while it contains drafts, because a public repository exposes its source files. Run `py build_site.py` (or `python build_site.py`) and preview `dist/` with `py -m http.server 8000 --directory dist`. This build also regenerates sitemap and `llms.txt` diary entries. See `docs/diary-setup.md` for the Cloudflare Functions, D1, Turnstile, Access and Resend setup; the online forms are not available until those services are configured.
## Existing content and backups

Nyxi and the existing artwork are already migrated to `works/products/nyxi.md` and `works/artworks/current-hero-artwork.md`; their current images and product details are preserved. The earlier catalogue files and guide are backed up in `assets/_content-backup/`. There were no story entries in the previous catalogue, so no story content was invented.

After editing any item, run the build command and refresh the browser. If validation reports a missing image, correct the `src` spelling or add the image at that path. If a required field is missing, fill it in before rebuilding.



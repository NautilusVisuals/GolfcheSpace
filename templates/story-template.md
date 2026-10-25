---
id: your-story-slug
slug: your-story-slug
title: Your story title
type: fanfiction
fandom: Your fandom
cover:
  src: assets/img/stories/your-story-slug/cover.jpg
  alt: Describe the cover artwork.
  width: 1200
  height: 1800
synopsis: "A short card and detail page synopsis."
subtitle: ""
genre: "Genre one, genre two"
status: Ongoing
warnings: []
storyText: |
  Paste the opening scene or complete story here. Blank lines separate paragraphs.

  Add Markdown style headings by starting a paragraph with ##.
chapters: []
images: []
characters: []
lore: []
authorNotes: ""
order: 1
---

Copy this file to a unique filename in works/stories/ and replace every example value. Supported types are fanfiction and comic. For each extra artwork, add an `images` item with `src`, `alt`, `width`, and `height`. `characters` items support `name`, `role`, `description`, and optional `image`. `lore` items support `title`, `content`, and optional `image`. `chapters` items support `title` and `content`; leave chapters empty when the storyText field contains the whole reading text. Keep all images in assets/img/stories/<slug>/. Run `py build_catalogs.py` after editing; readingTime is generated from storyText plus chapter content at 200 words per minute.

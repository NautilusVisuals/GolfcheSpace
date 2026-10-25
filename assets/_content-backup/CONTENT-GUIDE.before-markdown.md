# Add products, artworks, and stories

The three existing catalogue files are the only places where you add entries. The website reads them automatically. You do not need to make a new HTML page or edit layout code.

## The three entry files

| Content | Add/edit entries here | Copy-only template | Put public images here |
| --- | --- | --- | --- |
| Product | `assets/products/catalog.js` | `assets/products/_template/product.js.txt` | `assets/products/<product-slug>/` |
| Artwork | `assets/artworks/catalog.js` | `assets/artworks/_template/artwork.js.txt` | `assets/artworks/<artwork-id>/` |
| Story/comic | `assets/stories/catalog.js` | `assets/stories/_template/story.js.txt` | `assets/stories/<story-slug>/` |

The `_template` files end in `.txt`, are not included by any page, and never appear as catalogue entries. Open one, copy its complete object into the matching catalogue array, then replace the clearly labelled `CHANGE` values. Leave property names, commas, braces, and quotes in place. Optional fields can stay blank, be `null`, or be empty arrays as shown.

In VS Code, use the Explorer to make a folder with the same name as the item's ID or slug. Copy images into it. The paths in the catalog start at the website root: for example `assets/products/my-product/cover.jpg`. Keep paid ZIPs and other private downloads outside this public website folder.

## Add a product

1. Make `assets/products/my-product/` and copy its public thumbnail and preview images there.
2. Open `assets/products/_template/product.js.txt`, copy the whole `{ ... }` object, and paste it as a new entry inside `window.GolfcheProducts` in `assets/products/catalog.js`.
3. If another product is already there, add a comma after its closing `}`. Separate entries with commas.
4. Replace the ID and slug with unique lowercase names. Fill in the name, summaries, descriptions, image paths and actual image dimensions. Set a price only when it is confirmed. Leave `price` and `salePrice` as `null` until then; leave `purchaseUrl` empty if checkout is not configured.
5. Save and preview `products.html`. The card, filters, sorting, pagination, detail view, gallery, and cart use this same data.

The product template includes all supported detail fields: `thumbnail`, `mainImage`, extra `images`, `shortDescription`, `description`, `price`, `salePrice`, `category`, `badge`, `features`, `compatibility`, `compatibilityLabel`, `specifications`, `includes`, `installation`, and `purchaseUrl`. Use `category: 'characters'`, `'bundles'`, or `'other-assets'` to match the existing filters. Set `badge` to `null`, `'NEW'`, or `'SALE'`.

Copyable product entry: the complete starter object is in [`assets/products/_template/product.js.txt`](assets/products/_template/product.js.txt). Copy that object into the array; replace every `CHANGE` value and update the price only with a real amount and currency.

## Add an artwork

1. Make `assets/artworks/my-render-01/` and place a square thumbnail and full-resolution image inside it.
2. Copy the complete object in `assets/artworks/_template/artwork.js.txt` into `window.GolfcheArtworks` in `assets/artworks/catalog.js`.
3. Give it a unique `id`, then replace its title, image paths, alt descriptions, and actual dimensions. `caption`, `description`, `category`, `tags`, `date`, and `featured` are optional.
4. Save and preview `artworks.html`. The grid and lightbox read from this entry; Previous/Next follows catalog order.

If you have just one image, put its same path, alt text, width, and height in both `thumbnail` and `fullImage`. The square grid crops its tile; the lightbox opens the full-size file.

Copyable artwork entry: [`assets/artworks/_template/artwork.js.txt`](assets/artworks/_template/artwork.js.txt) contains a complete object with all supported optional fields.

## Add a story or comic

1. Make `assets/stories/my-story/`. Put the cover and any ordered comic pages in this folder.
2. Copy the complete object in `assets/stories/_template/story.js.txt` into `window.GolfcheStories` in `assets/stories/catalog.js`.
3. Give it a unique `id` and `slug`. Fill in the title and synopsis. Genre, status, tags, full description, chapters, comic pages, and `readingUrl` may be omitted or left blank.
4. To add comic pages, uncomment/copy the example page object for each file and change its path, alt text and actual dimensions. Keep the entries in reading order. Chapter entries can have a title, optional `content`, optional `url`, or both. External chapter links open safely in a new tab.
5. Save and preview `stories.html`. The cover makes the card; ordered comic pages appear in the detail gallery. Chapter details and links appear below the story description.

Copyable story entry: [`assets/stories/_template/story.js.txt`](assets/stories/_template/story.js.txt) contains a complete object with optional chapter and page examples.

## Change or remove something

- To change a title or description, edit that field on the matching object in its catalogue file.
- To change an image, copy the new file into that item's folder, update its `src`, and update `width` and `height` to the real pixel dimensions. Old files can stay until you know nothing else uses them.
- To remove an entry, remove only its complete object from the array, including the comma needed to keep the remaining JavaScript valid. This removes its card/detail from the site. You may keep its image folder as an archive; delete files only when you are sure they are not used elsewhere.
- Keep IDs and slugs unique. A product slug is also the detail URL and cart key; changing a published slug can make old links stop working.

## Preview locally

In VS Code, choose **Terminal → New Terminal**, then run this from the project root:

```powershell
python3 -m http.server 8000
```

On Windows, if `python3` is not recognized but Python is installed, try `py -m http.server 8000` instead.

Open `http://localhost:8000/products.html`, `http://localhost:8000/artworks.html`, or `http://localhost:8000/stories.html`. Stop the server with **Ctrl+C**. A local web server is needed because opening the HTML directly as a `file://` URL does not behave like the published site.

## What not to edit for routine entries

Leave `products.html`, `artworks.html`, `stories.html`, and `assets/site.js` alone when adding ordinary content. They provide the existing layout and renderer. The template `.txt` files are examples to copy; adding an entry means editing only the matching catalog file and placing files in that item's asset folder.

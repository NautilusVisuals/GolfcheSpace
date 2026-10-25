# Golfche Space

A personal creator portfolio built with plain HTML, CSS, JavaScript, and Python's standard library. There is no package installation or frontend framework.

## Where things go

- Artworks and renders: add Markdown entries in `works/artworks/`; artwork files go in `assets/img/artworks/`.
- Products and descriptions: `works/products/`; product images go in `assets/img/products/`. Keep paid downloads outside this public site.
- Diary and journal posts: `works/diary/`; post images go in `assets/img/diary/<slug>/`.
- Stories and comics: `works/stories/`; images go in `assets/img/stories/<slug>/`.
- Reusable content templates: `templates/` (see `templates/README.md`).
- Other shared images and social cards: `assets/` and `assets/og/`. Keep existing paths intact when replacing files.
- Appearance: shared catalogue styles are in `assets/site.css`; older essay, lab, and case-study pages keep their own styles in each HTML file.
- Website behavior and catalogues: `assets/site.js` and the catalogue scripts under `assets/`; content data is generated from `works/` by `build_catalogs.py`.
- Analytics: page templates have an `Analytics` marker in `<head>`. No analytics provider is configured currently. Add the same provider snippet to each public page if desired; do not put secrets in browser code.
- GitHub Pages deployment: `.github/workflows/pages.yml` builds the static site and publishes `dist/` on pushes to `main` or `master`.

## Create and publish content

1. Copy the matching file from `templates/` into its category under `works/` and rename it (lowercase hyphenated names are easiest).
2. Edit the template values and content. Keep the field names, YAML separators, and indentation; keep a diary draft at `published: false` until ready.
3. Add images to the matching `assets/img/` folder. Update each path, alt text, width, and height.
4. Run `py build_catalogs.py` for artwork, product, and story entries. For Diary pages and discovery files, run `py build_site.py`.
5. Preview catalogue changes at the root with `py -m http.server 8000`. For a built deployment preview, use `py -m http.server 8000 --directory dist` after `py build_site.py`. Visit `http://localhost:8000/` and stop the server with Ctrl+C.
6. Push to GitHub. The GitHub Actions workflow builds `dist/` and publishes it to GitHub Pages. Enable Pages under repository Settings → Pages → Build and deployment → GitHub Actions.

On Windows, use `python` instead of `py` if the Python launcher is unavailable. No test suite or package install is configured. `GIVE-THIS-TO-YOUR-AI.md` contains the full page-editing and site-safety manual; `CONTENT-GUIDE.md` has detailed catalogue field notes.

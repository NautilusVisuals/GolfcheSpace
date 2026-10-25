# Dear Diary: setup and deployment

## What the repo now does

- `works/diary/*.md` is the editable post source. The build includes only `published: true` entries in the public catalogue.
- `py build_site.py` builds the existing catalogues and a deployable `dist/` folder. It deliberately excludes the whole `works/` source tree, so draft Markdown is not present in public files.
- Keep the connected source repository private while it contains drafts. A public Git repository exposes Markdown drafts even when the deployed site excludes them.
- Each post opens as `diary.html?post=<slug>`. Posts remain file-based; the runtime database does not own post content.
- `functions/` contains Cloudflare Pages Functions. `migrations/0001_diary.sql` creates the private tables for comments, subscribers, delivery records and rate limits.
- Comments are always pending until you approve them. The optional comment email is not returned by public endpoints or shown in the admin screen.
- Subscriptions require a confirmation email. Newsletter messages go individually to confirmed subscribers and include an unsubscribe link. Notification sending is an explicit admin action.

## Services to configure

The repo contains no host, backend, database, mail credentials or existing deployment config. This implementation targets **Cloudflare Pages + Pages Functions + D1 + Turnstile**, because the existing project manual already recommends Cloudflare Pages for this static site. It uses **Resend** only for confirmation and newsletter email. Cloudflare Access protects administration. This keeps website hosting and the small API in one deployment, with post content separate from the database.

Create or connect:

1. **Cloudflare account / Pages project.** Connect the GitHub or GitLab repository. Set build command to `python build_site.py` and output directory to `dist`. Keep the repository root as the build root. Functions stay in the repository's root `functions/` folder; do not copy them into `dist/`. `_routes.json` limits Function execution to the admin page and `/api/*` endpoints.
2. **Cloudflare D1 database.** Create a database (for example `golfche-diary`). In the Pages project's production and preview settings, add a D1 binding named `DB` pointing to that database. Apply `migrations/0001_diary.sql` remotely with Wrangler. Keep preview data separate from production.
3. **Cloudflare Turnstile.** Create a widget restricted to the website and local development hostnames. The site key is public; the secret key stays server-side. Both are required to enable comments and subscription forms.
4. **Resend.** Create an account, verify a sending domain, and use a sender on that verified domain (for example `Letters from Golfche <letters@your-domain>`). DNS verification is your own domain-specific setup; this repo does not invent it.
5. **Cloudflare Access.** Add self-hosted applications for the site's `/diary-admin.html` path and `/api/admin*` path. Add an Allow policy for only your administrator email. Protect both paths, on the production hostname and any hostname where admin APIs are enabled. Pages Functions independently validate the Access JWT audience for each app and the exact `ADMIN_EMAIL` claim. The page returns 404 unless its Access audience is configured.

For local Pages Functions development, install Node.js if needed and use Wrangler with the local Pages output and local D1 binding. Keep secrets in an ignored `.dev.vars` file. A static `python -m http.server --directory dist` preview renders the diary but does not run Functions, so the forms correctly report that they are not configured there.

## Environment variables and bindings

Set these in Cloudflare Pages **production and preview** environments as appropriate. Do not paste values into chat or commit them.

| Name | Type | Purpose |
|---|---|---|
| `DB` | D1 binding | Database binding name; configure in Pages settings |
| `TURNSTILE_SITE_KEY` | public variable | Turnstile widget site key |
| `TURNSTILE_SECRET_KEY` | secret | Server-side Turnstile validation |
| `RESEND_API_KEY` | secret | Resend email API credential |
| `MAIL_FROM` | variable | Verified sender, e.g. `Letters from Golfche <letters@your-domain>` |
| `ACCESS_TEAM_DOMAIN` | variable | Your Cloudflare Access team host, without `https://` |
| `ACCESS_AUD` | variable | Access application's audience tag for the protected admin API |
| `ACCESS_PAGE_AUD` | variable | Access application's audience tag for the protected admin page |
| `ADMIN_EMAIL` | variable | The single administrator email allowed by this API |
| `RATE_LIMIT_SALT` | secret | Random high-entropy value used to hash transient client IPs |

`ACCESS_AUD` must match the audience tag Cloudflare Access assigns to the application protecting `/api/admin*`. `ACCESS_PAGE_AUD` must match the `/diary-admin.html` application's audience tag. The code checks the signed Access JWT, its expiry and audience, and checks `ADMIN_EMAIL`. The browser receives no admin credential or provider secret.

Local `.dev.vars` example (replace values on your computer only):

```dotenv
TURNSTILE_SITE_KEY=your-local-site-key
TURNSTILE_SECRET_KEY=your-local-secret
RESEND_API_KEY=your-resend-key
MAIL_FROM=Letters from Golfche <letters@your-verified-domain>
ACCESS_TEAM_DOMAIN=your-team.cloudflareaccess.com
ACCESS_AUD=your-access-audience-tag
ACCESS_PAGE_AUD=your-admin-page-audience-tag
ADMIN_EMAIL=you@example.net
RATE_LIMIT_SALT=use-a-long-random-secret
```

The D1 binding is supplied to local Wrangler with its local D1 option. Apply the migration to the local database before testing forms.

## Local preview and deploy

1. Copy/edit a post in `works/diary/`, add images under `assets/img/diary/<slug>/`, and set `published: true` only when ready.
2. Build: `py build_site.py` (or `python build_site.py`). This also runs the existing artwork, product and story catalogue checks.
3. Static preview: `py -m http.server 8000 --directory dist`; open `http://localhost:8000/diary.html`.
4. To exercise real Functions, run Wrangler's Pages local development against `dist/`, bind a local D1 database, load the local Turnstile keys and `.dev.vars`, and use a test email inbox. Cloudflare Access is not reproduced by a static server; verify admin authorization on a protected preview deployment.
5. Push your source changes. Cloudflare Pages runs the configured build and deploys the output. Configure D1 bindings and environment values before expecting forms to work.

To test the real email lifecycle, use an address you control: subscribe, click the confirmation email, send one test notification from the protected admin page, then click its unsubscribe link and confirm the address has been removed. Avoid using the production subscriber list for tests.

## Admin tasks

- **Approve/reject/delete comments:** open `/diary-admin.html` after Cloudflare Access sign-in.
- **View/remove confirmed subscribers:** the same protected page; removal deletes the stored address and its unsubscribe tokens.
- **Publish/unpublish:** change `published: true` or `false` in the post's Markdown file and push the change. The deployment build excludes drafts. Content remains in Markdown as the source of truth; it is not edited in the database.
- **Disable comments:** set `commentsEnabled: false` in that post's Markdown and deploy. The API checks the public post metadata before accepting or returning comments.
- **Send a notification:** after publishing and deployment, select the published post in the admin page and click **Send to confirmed subscribers**. Edits never send automatically. Per-post/per-subscriber delivery records and provider idempotency keys prevent successful deliveries from being resent; retry only failed recipients.

Failed notification deliveries can be retried within 24 hours using Resend's idempotency window. Older ambiguous attempts are closed rather than resent, which avoids a possible duplicate if the provider accepted an email before a connection failed.

## Privacy and service limits

No visitor account is created. Comment name/text are public after approval; optional comment email is private and never displayed. Newsletter email stays in D1 until unsubscribe/removal. Rate-limit records store salted hashes rather than raw IP addresses and are pruned after a day. Turnstile tokens are checked server-side; the honeypot and server-side input bounds are additional protections. Public comment markup is escaped and comment email is never returned by the public endpoint.

Until Cloudflare, D1, Turnstile, Access and Resend are configured, comments, subscriptions, administration and email are **not operational**. The site shows unavailable messages and does not claim a subscription succeeded.

export const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
export const bad = (message, status = 400) => json({ error: message }, status);
export const clean = (value, max) => String(value || "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max);
export const plainText = (value, max) => clean(value, max).replace(/<[^>]*>/g, "").replace(/[\u202a-\u202e\u2066-\u2069]/g, "").trim();
export const sha256 = async (value) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))).map((b) => b.toString(16).padStart(2, "0")).join("");
export const token = () => Array.from(crypto.getRandomValues(new Uint8Array(32))).map((b) => b.toString(16).padStart(2, "0")).join("");

export async function body(request, maxBytes = 12000) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > maxBytes) throw new Error("Request is too large.");
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) throw new Error("Request is too large.");
  try { return JSON.parse(text); } catch { throw new Error("Invalid request."); }
}

export async function turnstile(request, env, response) {
  if (!env.TURNSTILE_SECRET_KEY) return false;
  if (!response || !env.TURNSTILE_SITE_KEY) return false;
  const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response, remoteip: request.headers.get("CF-Connecting-IP") || "" });
  const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form, headers: { "content-type": "application/x-www-form-urlencoded" } });
  if (!result.ok) return false;
  const data = await result.json();
  return data.success === true;
}

export async function rateLimit(request, env, scope, limit, minutes) {
  if (!env.DB || !env.RATE_LIMIT_SALT) return false;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const key = await sha256(`${env.RATE_LIMIT_SALT}:${scope}:${ip}`);
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - minutes * 60;
  const row = await env.DB.prepare("INSERT INTO rate_limits (key_hash, hits, window_start) VALUES (?, 1, ?) ON CONFLICT(key_hash) DO UPDATE SET hits=CASE WHEN window_start <= ? THEN 1 ELSE hits+1 END, window_start=CASE WHEN window_start <= ? THEN excluded.window_start ELSE window_start END RETURNING hits").bind(key, now, windowStart, windowStart).first();
  await env.DB.prepare("DELETE FROM rate_limits WHERE window_start < ?").bind(now - 86400).run();
  return (row?.hits || limit + 1) <= limit;
}

export async function sendEmail(env, { to, subject, html, text, idempotencyKey }) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) throw new Error("Email service is not configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json", "idempotency-key": idempotencyKey },
    body: JSON.stringify({ from: env.MAIL_FROM, to, subject, html, text })
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}.`);
  return response.json();
}

export function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

export async function publishedPost(slug, origin) {
  const response = await fetch(new URL("/assets/diary/catalog.js", origin));
  if (!response.ok) return null;
  const source = await response.text();
  const match = /^window\.GolfcheDiary\s*=\s*(\[[\s\S]*\]);\s*$/m.exec(source);
  if (!match) return null;
  const posts = JSON.parse(match[1]);
  return posts.find((post) => post.slug === slug && post.published === true) || null;
}

async function accessKey(env, kid) {
  const cacheKey = new Request(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
  const cache = caches.default;
  let response = await cache.match(cacheKey);
  if (!response) {
    response = await fetch(cacheKey.url);
    if (response.ok) await cache.put(cacheKey, response.clone());
  }
  if (!response?.ok) return null;
  const { keys = [] } = await response.json();
  return keys.find((key) => key.kid === kid) || null;
}

export async function requireAdmin(request, env, expectedAudience = env.ACCESS_AUD) {
  if (!env.ACCESS_TEAM_DOMAIN || !expectedAudience) return null;
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!jwt) return null;
  try {
    const [headerPart, claimsPart, signaturePart] = jwt.split(".");
    const header = JSON.parse(atob(headerPart.replace(/-/g, "+").replace(/_/g, "/")));
    const claims = JSON.parse(atob(claimsPart.replace(/-/g, "+").replace(/_/g, "/")));
    if (header.alg !== "RS256" || !header.kid || claims.exp <= Date.now() / 1000 || !(claims.aud || []).includes(expectedAudience)) return null;
    const keyJwk = await accessKey(env, header.kid);
    if (!keyJwk) return null;
    const key = await crypto.subtle.importKey("jwk", keyJwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const signature = Uint8Array.from(atob(signaturePart.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, new TextEncoder().encode(`${headerPart}.${claimsPart}`));
    if (!valid || !claims.email) return null;
    if (env.ADMIN_EMAIL && claims.email.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) return null;
    return claims.email;
  } catch { return null; }
}

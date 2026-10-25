import { bad, body, clean, json, plainText, publishedPost, rateLimit, turnstile } from "../../_lib/diary.js";

export async function onRequestGet({ request, env }) {
  if (!env.DB) return bad("Comments are not configured yet.", 503);
  const slug = new URL(request.url).searchParams.get("slug") || "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return bad("Invalid post.");
  let post;
  try { post = await publishedPost(slug, new URL(request.url).origin); } catch { return bad("Comments are temporarily unavailable.", 503); }
  if (!post || post.commentsEnabled !== true) return bad("Comments are disabled for this post.", 404);
  const { results = [] } = await env.DB.prepare("SELECT id, display_name, comment_text, created_at FROM comments WHERE post_slug = ? AND status = 'approved' ORDER BY created_at ASC LIMIT 100").bind(slug).all();
  return json({ comments: results });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB || !env.TURNSTILE_SECRET_KEY || !env.RATE_LIMIT_SALT) return bad("Comments are temporarily unavailable.", 503);
  let data;
  try { data = await body(request); } catch (error) { return bad(error.message); }
  if (clean(data.website, 100)) return json({ ok: true });
  const slug = clean(data.slug, 80), name = plainText(data.name, 60), text = plainText(data.text, 3000), email = clean(data.email, 254).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || name.length < 1 || text.length < 2 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return bad("Check your name, comment, and optional email address.");
  let post;
  try { post = await publishedPost(slug, new URL(request.url).origin); } catch { return bad("Comments are temporarily unavailable.", 503); }
  if (!post || post.commentsEnabled !== true) return bad("Comments are disabled for this post.", 404);
  if (!await rateLimit(request, env, "comment", 5, 60)) return bad("Please wait before sending another comment.", 429);
  try { if (!await turnstile(request, env, data.turnstileToken)) return bad("Please complete the spam check and try again.", 400); }
  catch { return bad("Spam protection is temporarily unavailable.", 503); }
  try {
    await env.DB.prepare("INSERT INTO comments (post_slug, display_name, private_email, comment_text, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)").bind(slug, name, email || null, text, Math.floor(Date.now() / 1000)).run();
    return json({ ok: true, message: "Your comment is awaiting approval." }, 201);
  } catch { return bad("Comments are temporarily unavailable.", 503); }
}

import { bad, body, clean, escapeHtml, json, publishedPost, requireAdmin, sendEmail, sha256, token } from "../../_lib/diary.js";

export async function onRequest(context) {
  const { request, env } = context;
  const admin = await requireAdmin(request, env);
  if (!admin) return bad("Administrator access required.", 401);
  if (!env.DB) return bad("The database is not configured.", 503);
  const url = new URL(request.url), action = url.searchParams.get("action") || "";

  if (request.method === "GET" && action === "comments") {
    const { results = [] } = await env.DB.prepare("SELECT id, post_slug, display_name, comment_text, status, created_at FROM comments ORDER BY created_at DESC LIMIT 300").all();
    return json({ comments: results });
  }
  if (request.method === "GET" && action === "subscribers") {
    const { results = [] } = await env.DB.prepare("SELECT id, email, status, created_at, updated_at FROM subscribers ORDER BY created_at DESC LIMIT 1000").all();
    return json({ subscribers: results });
  }
  if (request.method === "PATCH" && action === "comment") {
    let data;
    try { data = await body(request, 2000); } catch (error) { return bad(error.message); }
    const status = clean(data.status, 20), id = Number(data.id);
    if (!Number.isInteger(id) || !["pending", "approved", "rejected"].includes(status)) return bad("Invalid moderation change.");
    const result = await env.DB.prepare("UPDATE comments SET status=? WHERE id=?").bind(status, id).run();
    return result.meta.changes ? json({ ok: true }) : bad("Comment not found.", 404);
  }
  if (request.method === "DELETE" && action === "comment") {
    const id = Number(url.searchParams.get("id"));
    if (!Number.isInteger(id)) return bad("Invalid comment.");
    await env.DB.prepare("DELETE FROM comments WHERE id=?").bind(id).run();
    return json({ ok: true });
  }
  if (request.method === "DELETE" && action === "subscriber") {
    const id = Number(url.searchParams.get("id"));
    if (!Number.isInteger(id)) return bad("Invalid subscriber.");
    await env.DB.prepare("DELETE FROM subscribers WHERE id=?").bind(id).run();
    return json({ ok: true });
  }
  if (request.method === "POST" && action === "notify") {
    let data;
    try { data = await body(request, 2000); } catch (error) { return bad(error.message); }
    const slug = clean(data.slug, 80);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return bad("Invalid post.");
    let post;
    try { post = await publishedPost(slug, url.origin); }
    catch { return bad("Published posts could not be checked.", 503); }
    if (!post) return bad("Only published posts can be emailed.", 400);
    const subscribers = await env.DB.prepare("SELECT id, email FROM subscribers WHERE status='confirmed'").all();
    if (!subscribers.results?.length) return json({ ok: true, sent: 0, message: "There are no confirmed subscribers." });
    const summary = escapeHtml(clean(post.excerpt, 360));
    const title = escapeHtml(clean(post.title, 160));
    const postUrl = `${url.origin}/diary/${encodeURIComponent(slug)}.html`;
    let sent = 0, failed = 0;
    for (const subscriber of subscribers.results) {
      const existing = await env.DB.prepare("SELECT status, updated_at FROM notification_deliveries WHERE post_slug=? AND subscriber_id=?").bind(slug, subscriber.id).first();
      if (existing?.status === "sent") continue;
      const now = Math.floor(Date.now() / 1000);
      if (existing?.status === "pending") { failed++; continue; }
      if (existing?.status === "failed" && now - existing.updated_at > 86400) { failed++; continue; }
      if (existing?.status === "failed") {
        const claimed = await env.DB.prepare("UPDATE notification_deliveries SET status='pending', updated_at=? WHERE post_slug=? AND subscriber_id=? AND status='failed'").bind(now, slug, subscriber.id).run();
        if (!claimed.meta.changes) continue;
      } else {
        const claimed = await env.DB.prepare("INSERT INTO notification_deliveries (post_slug, subscriber_id, status, updated_at) VALUES (?, ?, 'pending', ?) ON CONFLICT(post_slug, subscriber_id) DO NOTHING").bind(slug, subscriber.id, now).run();
        if (!claimed.meta.changes) continue;
      }
      const unsubscribe = token();
      await env.DB.prepare("INSERT INTO unsubscribe_tokens (token_hash, subscriber_id, created_at) VALUES (?, ?, ?)").bind(await sha256(unsubscribe), subscriber.id, Math.floor(Date.now() / 1000)).run();
      const unsubscribeUrl = `${url.origin}/diary.html?unsubscribe=${encodeURIComponent(unsubscribe)}`;
      try {
        await sendEmail(env, {
          to: subscriber.email,
          subject: `Dear Diary: ${clean(post.title, 160)}`,
          html: `<p>A new post from Golfche Space</p><h1>${title}</h1><p>${summary}</p><p><a href="${postUrl}">Read the post</a></p><hr><p><a href="${unsubscribeUrl}">Unsubscribe</a></p>`,
          text: `A new post from Golfche Space: ${clean(post.title, 160)}\n\n${clean(post.excerpt, 360)}\n\nRead: ${postUrl}\n\nUnsubscribe: ${unsubscribeUrl}`,
          idempotencyKey: `diary-notify-${slug}-${subscriber.id}`
        });
        await env.DB.prepare("UPDATE notification_deliveries SET status='sent', updated_at=? WHERE post_slug=? AND subscriber_id=?").bind(Math.floor(Date.now() / 1000), slug, subscriber.id).run();
        sent++;
      } catch {
        await env.DB.prepare("UPDATE notification_deliveries SET status='failed', updated_at=? WHERE post_slug=? AND subscriber_id=?").bind(Math.floor(Date.now() / 1000), slug, subscriber.id).run();
        failed++;
      }
    }
    return json({ ok: failed === 0, sent, failed, message: failed ? "Some emails failed or have an unresolved prior attempt. Successful deliveries will not repeat. Retry failed sends within 24 hours; older unresolved attempts are closed to avoid duplicates." : "Notification sent to confirmed subscribers." }, failed ? 502 : 200);
  }
  return bad("Unknown administration action.", 404);
}

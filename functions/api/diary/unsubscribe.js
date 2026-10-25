import { bad, body, json, sha256 } from "../../_lib/diary.js";
export async function onRequestPost({ request, env }) {
  if (!env.DB) return bad("Subscriptions are not configured.", 503);
  let data;
  try { data = await body(request, 1000); } catch (error) { return bad(error.message); }
  const token = String(data.token || "");
  if (token.length !== 64) return bad("That unsubscribe link is invalid.");
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare("SELECT subscriber_id FROM unsubscribe_tokens WHERE token_hash=?").bind(tokenHash).first();
  if (!row) return bad("This link is invalid or the subscription was already removed.", 404);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM subscribers WHERE id=? AND status='confirmed'").bind(row.subscriber_id),
    env.DB.prepare("DELETE FROM unsubscribe_tokens WHERE subscriber_id=?").bind(row.subscriber_id)
  ]);
  return json({ ok: true, message: "You have been unsubscribed." });
}

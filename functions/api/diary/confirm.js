import { bad, json, sha256 } from "../../_lib/diary.js";
export async function onRequestGet({ request, env }) {
  if (!env.DB) return bad("Subscriptions are not configured.", 503);
  const token = new URL(request.url).searchParams.get("token") || "";
  if (token.length !== 64) return bad("That confirmation link is invalid or expired.");
  const hash = await sha256(token), now = Math.floor(Date.now() / 1000);
  const result = await env.DB.prepare("UPDATE subscribers SET status='confirmed', confirm_token_hash=NULL, updated_at=? WHERE confirm_token_hash=? AND status='pending' AND updated_at > ?").bind(now, hash, now - 86400).run();
  if (!result.meta.changes) return bad("That confirmation link is invalid, expired, or already used.");
  return json({ ok: true, message: "Your email is confirmed. Thank you for subscribing." });
}

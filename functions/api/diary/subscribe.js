import { bad, body, clean, json, rateLimit, sendEmail, sha256, token, turnstile } from "../../_lib/diary.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB || !env.TURNSTILE_SECRET_KEY || !env.RATE_LIMIT_SALT || !env.RESEND_API_KEY || !env.MAIL_FROM) return bad("Subscriptions are temporarily unavailable.", 503);
  let data;
  try { data = await body(request, 4000); } catch (error) { return bad(error.message); }
  if (clean(data.website, 100)) return json({ ok: true, message: "If this address can be subscribed, a confirmation email will arrive shortly." });
  const email = clean(data.email, 254).toLowerCase();
  if (!data.consent || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("Enter a valid email and agree to the updates.");
  if (!await rateLimit(request, env, "subscribe", 4, 60)) return bad("Please wait before trying again.", 429);
  try { if (!await turnstile(request, env, data.turnstileToken)) return bad("Please complete the spam check and try again."); }
  catch { return bad("Spam protection is temporarily unavailable.", 503); }
  const existing = await env.DB.prepare("SELECT id, status FROM subscribers WHERE email = ?").bind(email).first();
  if (existing?.status === "confirmed") return json({ ok: true, message: "This address is already confirmed." });
  const secret = token(), tokenHash = await sha256(secret), now = Math.floor(Date.now() / 1000);
  let subscriberId = existing?.id;
  if (subscriberId) {
    await env.DB.prepare("UPDATE subscribers SET status='pending', confirm_token_hash=?, updated_at=? WHERE id=?").bind(tokenHash, now, subscriberId).run();
  } else {
    const inserted = await env.DB.prepare("INSERT INTO subscribers (email, status, confirm_token_hash, created_at, updated_at) VALUES (?, 'pending', ?, ?, ?) RETURNING id").bind(email, tokenHash, now, now).first();
    subscriberId = inserted.id;
  }
  const confirmUrl = `${new URL(request.url).origin}/diary.html?confirm=${encodeURIComponent(secret)}`;
  const html = `<p>Confirm occasional updates from Golfche Space.</p><p><a href="${confirmUrl}">Confirm subscription</a></p><p>If you did not request this, ignore this email.</p>`;
  try {
    await sendEmail(env, { to: email, subject: "Confirm Letters from Golfche", html, text: `Confirm your subscription: ${confirmUrl}`, idempotencyKey: `diary-confirm-${subscriberId}-${tokenHash}` });
    return json({ ok: true, message: "Check your inbox for a confirmation link. You are not subscribed until you confirm." }, 202);
  } catch {
    await env.DB.prepare("UPDATE subscribers SET status='pending', confirm_token_hash=NULL WHERE id=? AND confirm_token_hash=?").bind(subscriberId, tokenHash).run();
    return bad("We could not send the confirmation email. Please try again later.", 503);
  }
}

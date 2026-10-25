import { json } from "../../_lib/diary.js";
export function onRequestGet({ env }) {
  const guarded = Boolean(env.DB && env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY && env.RATE_LIMIT_SALT);
  return json({ commentsConfigured: guarded, emailConfigured: Boolean(guarded && env.RESEND_API_KEY && env.MAIL_FROM), turnstileSiteKey: guarded ? env.TURNSTILE_SITE_KEY : "" });
}

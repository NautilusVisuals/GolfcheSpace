import { requireAdmin } from "./_lib/diary.js";

export async function onRequest({ request, env, next }) {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/diary-admin.html") {
    const email = await requireAdmin(request, env, env.ACCESS_PAGE_AUD);
    if (!email) return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
  }
  return next();
}

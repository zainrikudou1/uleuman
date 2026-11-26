import { jsonResponse, verifyPassword, createSessionCookie } from '../_utils.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const password = String(body?.password || '');
    if (!env.ADMIN_PASSWORD_HASH || !env.ADMIN_SESSION_SECRET) {
      return jsonResponse({ ok: false, error: 'Server secrets ADMIN_PASSWORD_HASH / ADMIN_SESSION_SECRET belum dikonfigurasi.' }, 500);
    }
    const valid = await verifyPassword(password, env.ADMIN_PASSWORD_HASH);
    if (!valid) {
      return jsonResponse({ ok: false, error: 'Kata sandi admin tidak valid.' }, 401);
    }
    const cookie = await createSessionCookie(env.ADMIN_SESSION_SECRET, 86400);
    return jsonResponse({ ok: true }, 200, { 'Set-Cookie': cookie });
  } catch (e) {
    return jsonResponse({ ok: false, error: 'Permintaan login tidak valid.' }, 400);
  }
}

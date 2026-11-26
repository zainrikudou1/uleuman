import { jsonResponse, clearSessionCookie } from '../_utils.js';

export async function onRequestPost() {
  return jsonResponse({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
}

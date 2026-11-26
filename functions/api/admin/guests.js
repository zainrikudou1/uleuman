import { jsonResponse, sanitizeStr, requireAdmin } from '../_utils.js';

export async function onRequestGet({ request, env }) {
  if (!(await requireAdmin(request, env))) {
    return jsonResponse({ ok: false, error: 'Akses ditolak.' }, 401);
  }
  const res = await env.DB.prepare('SELECT id, name, phone, group_label, slug_param, created_at FROM guests ORDER BY id DESC').all();
  return jsonResponse({ ok: true, items: res?.results || [] });
}

export async function onRequestPost({ request, env }) {
  if (!(await requireAdmin(request, env))) {
    return jsonResponse({ ok: false, error: 'Akses ditolak.' }, 401);
  }
  try {
    const body = await request.json();
    const name = sanitizeStr(body?.name, 80);
    const phone = sanitizeStr(body?.phone, 30);
    const groupLabel = sanitizeStr(body?.group_label || 'Umum', 40);
    if (!name) return jsonResponse({ ok: false, error: 'Nama tamu wajib diisi.' }, 400);
    const slugParam = encodeURIComponent(name).replace(/%20/g, '+');
    await env.DB.prepare(
      'INSERT INTO guests (name, phone, group_label, slug_param) VALUES (?, ?, ?, ?)'
    ).bind(name, phone, groupLabel, slugParam).run();
    return jsonResponse({ ok: true }, 201);
  } catch (e) {
    return jsonResponse({ ok: false, error: 'Gagal menambah tamu.' }, 500);
  }
}

export async function onRequestDelete({ request, env }) {
  if (!(await requireAdmin(request, env))) {
    return jsonResponse({ ok: false, error: 'Akses ditolak.' }, 401);
  }
  const url = new URL(request.url);
  const id = parseInt(url.searchParams.get('id') || '0', 10);
  if (!id) return jsonResponse({ ok: false, error: 'ID tidak valid.' }, 400);
  await env.DB.prepare('DELETE FROM guests WHERE id = ?').bind(id).run();
  return jsonResponse({ ok: true });
}

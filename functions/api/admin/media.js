import { jsonResponse, sanitizeStr, requireAdmin } from '../_utils.js';

export async function onRequestPost({ request, env }) {
  if (!(await requireAdmin(request, env))) {
    return jsonResponse({ ok: false, error: 'Akses ditolak.' }, 401);
  }
  try {
    const body = await request.json();
    const slot = sanitizeStr(body?.slot || 'gallery', 20);
    const title = sanitizeStr(body?.title || '', 80);
    const orientation = body?.orientation === 'landscape' ? 'landscape' : 'portrait';
    const mimeType = sanitizeStr(body?.mime_type || 'image/jpeg', 40);
    const dataUrl = String(body?.data_url || '');

    if (!dataUrl.startsWith('data:image/') && !dataUrl.startsWith('https://')) {
      return jsonResponse({ ok: false, error: 'Format media tidak valid.' }, 400);
    }
    if (dataUrl.length > 1800000) {
      return jsonResponse({ ok: false, error: 'Ukuran gambar terlalu besar (maks ~1.3 MB terkompresi).' }, 413);
    }

    if (slot === 'groom' || slot === 'bride') {
      await env.DB.prepare('DELETE FROM media_assets WHERE slot = ?').bind(slot).run();
    }

    await env.DB.prepare(
      'INSERT INTO media_assets (slot, title, orientation, mime_type, data_url) VALUES (?, ?, ?, ?, ?)'
    ).bind(slot, title, orientation, mimeType, dataUrl).run();

    return jsonResponse({ ok: true }, 201);
  } catch (e) {
    return jsonResponse({ ok: false, error: 'Gagal mengunggah media.' }, 500);
  }
}

export async function onRequestDelete({ request, env }) {
  if (!(await requireAdmin(request, env))) {
    return jsonResponse({ ok: false, error: 'Akses ditolak.' }, 401);
  }
  const url = new URL(request.url);
  const id = parseInt(url.searchParams.get('id') || '0', 10);
  if (!id) return jsonResponse({ ok: false, error: 'ID tidak valid.' }, 400);
  await env.DB.prepare('DELETE FROM media_assets WHERE id = ?').bind(id).run();
  return jsonResponse({ ok: true });
}

import { jsonResponse, requireAdmin } from './_utils.js';

export async function onRequestGet({ env }) {
  try {
    const row = await env.DB.prepare('SELECT config_json, updated_at FROM invitation_config WHERE id = 1').first();
    const mediaRows = await env.DB.prepare('SELECT id, slot, title, orientation, mime_type, data_url, sort_order FROM media_assets ORDER BY sort_order ASC, id ASC').all();
    const config = row ? JSON.parse(row.config_json) : null;
    const assets = mediaRows?.results || [];
    const groomAsset = assets.find((a) => a.slot === 'groom');
    const brideAsset = assets.find((a) => a.slot === 'bride');
    const gallery = assets.filter((a) => a.slot === 'gallery');

    return jsonResponse({
      ok: true,
      config,
      media: {
        groomPhoto: groomAsset ? groomAsset.data_url : '',
        bridePhoto: brideAsset ? brideAsset.data_url : '',
        gallery
      },
      updatedAt: row?.updated_at || null
    });
  } catch (e) {
    return jsonResponse({ ok: false, error: 'Gagal memuat konfigurasi undangan.' }, 500);
  }
}

export async function onRequestPut({ request, env }) {
  if (!(await requireAdmin(request, env))) {
    return jsonResponse({ ok: false, error: 'Akses ditolak. Silakan login admin.' }, 401);
  }
  try {
    const body = await request.json();
    if (!body || typeof body.config !== 'object') {
      return jsonResponse({ ok: false, error: 'Payload config tidak valid.' }, 400);
    }
    const serialized = JSON.stringify(body.config);
    if (serialized.length > 500000) {
      return jsonResponse({ ok: false, error: 'Ukuran konfigurasi melebihi batas.' }, 413);
    }
    await env.DB.prepare(
      'INSERT INTO invitation_config (id, config_json, updated_at) VALUES (1, ?, datetime("now")) ON CONFLICT(id) DO UPDATE SET config_json = excluded.config_json, updated_at = datetime("now")'
    ).bind(serialized).run();
    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ ok: false, error: 'Gagal menyimpan konfigurasi.' }, 500);
  }
}

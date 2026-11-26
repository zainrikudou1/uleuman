import { jsonResponse, sanitizeStr, requireAdmin } from './_utils.js';

export async function onRequestGet({ env }) {
  try {
    const res = await env.DB.prepare(
      'SELECT id, guest_name, attendance, guest_count, message, created_at FROM rsvps ORDER BY id DESC LIMIT 100'
    ).all();
    return jsonResponse({ ok: true, items: res?.results || [] });
  } catch (e) {
    return jsonResponse({ ok: false, error: 'Gagal memuat daftar RSVP.' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const guestName = sanitizeStr(body?.guest_name, 80);
    const attendance = String(body?.attendance || 'hadir');
    const guestCount = Math.max(1, Math.min(20, parseInt(body?.guest_count || '1', 10) || 1));
    const message = sanitizeStr(body?.message, 400);

    if (!guestName) {
      return jsonResponse({ ok: false, error: 'Nama tamu wajib diisi.' }, 400);
    }
    if (!['hadir', 'tidak_hadir', 'ragu'].includes(attendance)) {
      return jsonResponse({ ok: false, error: 'Status kehadiran tidak valid.' }, 400);
    }

    await env.DB.prepare(
      'INSERT INTO rsvps (guest_name, attendance, guest_count, message) VALUES (?, ?, ?, ?)'
    ).bind(guestName, attendance, guestCount, message).run();

    return jsonResponse({ ok: true }, 201);
  } catch (e) {
    return jsonResponse({ ok: false, error: 'Gagal menyimpan RSVP.' }, 500);
  }
}

export async function onRequestDelete({ request, env }) {
  if (!(await requireAdmin(request, env))) {
    return jsonResponse({ ok: false, error: 'Akses ditolak.' }, 401);
  }
  try {
    const url = new URL(request.url);
    const id = parseInt(url.searchParams.get('id') || '0', 10);
    if (!id) return jsonResponse({ ok: false, error: 'ID tidak valid.' }, 400);
    await env.DB.prepare('DELETE FROM rsvps WHERE id = ?').bind(id).run();
    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ ok: false, error: 'Gagal menghapus RSVP.' }, 500);
  }
}

import { jsonResponse, requireAdmin } from './_utils.js';

function csvEscape(val) {
  const s = String(val ?? '').replace(/"/g, '""');
  return `"${s}"`;
}

export async function onRequestGet({ request, env }) {
  if (!(await requireAdmin(request, env))) {
    return jsonResponse({ ok: false, error: 'Akses ditolak.' }, 401);
  }
  try {
    const res = await env.DB.prepare(
      'SELECT id, guest_name, attendance, guest_count, message, created_at FROM rsvps ORDER BY id DESC'
    ).all();
    const rows = res?.results || [];
    const header = ['ID', 'Nama Tamu', 'Kehadiran', 'Jumlah Tamu', 'Pesan & Doa', 'Waktu'].join(',');
    const lines = rows.map((r) => [
      csvEscape(r.id),
      csvEscape(r.guest_name),
      csvEscape(r.attendance),
      csvEscape(r.guest_count),
      csvEscape(r.message),
      csvEscape(r.created_at)
    ].join(','));
    const csv = [header, ...lines].join('\r\n');
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="rsvp-saepudin-khodijah.csv"',
        'Cache-Control': 'no-store'
      }
    });
  } catch (e) {
    return jsonResponse({ ok: false, error: 'Gagal mengekspor CSV.' }, 500);
  }
}

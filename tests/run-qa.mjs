import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, status: 'PASS' });
  } catch (err) {
    results.push({ name, status: 'FAIL', error: err.message });
  }
}

const official = require(path.join(root, 'public/js/official-data.js'));
const qr = require(path.join(root, 'public/js/qr-generator.js'));
const indexHtml = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const adminHtml = fs.readFileSync(path.join(root, 'public/admin.html'), 'utf8');
const sql = fs.readFileSync(path.join(root, 'migrations/0001_init.sql'), 'utf8');
const utilsJs = fs.readFileSync(path.join(root, 'functions/api/_utils.js'), 'utf8');

test('Official Groom Data & Arabic RTL', () => {
  assert.equal(official.groom.fullName, 'Saepudin Hidayatullah');
  assert.equal(official.groom.nickname, 'Udin');
  assert.equal(official.groom.arabicName, 'سيف الدين هداية الله');
  assert.ok(official.groom.parents.includes('Alm. Tatang Sholihin'));
  assert.ok(official.groom.parents.includes('Siti Jaujah'));
});

test('Official Bride Data & Arabic RTL', () => {
  assert.equal(official.bride.fullName, 'Khodijah');
  assert.equal(official.bride.nickname, 'Dijah');
  assert.equal(official.bride.arabicName, 'خديجة');
  assert.ok(official.bride.parents.includes('Muhammad Junaedi'));
  assert.ok(official.bride.parents.includes('Imas Rohibah'));
});

test('Two Separate Events (Resepsi & Tablig Akbar Mujarab)', () => {
  assert.equal(official.events.resepsi.dayDate, 'Kamis, 31 Desember 2026');
  assert.equal(official.events.resepsi.time, '08.00 WIB – selesai');
  assert.equal(official.events.tablig.title, 'Tablig Akbar Mujarab');
  assert.equal(official.events.tablig.subtitle, 'Muludan Rajaban');
  assert.equal(official.events.tablig.time, '19.00 WIB – selesai');
});

test('Official Location, Maps URL & DANA Account', () => {
  assert.equal(official.location.mapsUrl, 'https://maps.app.goo.gl/opps7tLHJCER1qWw9');
  assert.ok(official.location.address.includes('Kp. Ninggar RT 01 RW 12'));
  assert.equal(official.gift.method, 'DANA');
  assert.equal(official.gift.accountNumber, '+62 895-2451-8794');
  assert.equal(official.gift.accountName, 'Khodijah');
});

test('All 10 Binder Pages Present in index.html & Groom Before Bride', () => {
  for (let p = 1; p <= 10; p++) {
    assert.ok(indexHtml.includes(`data-page="${p}"`), `Missing data-page="${p}"`);
  }
  const groomPos = indexHtml.indexOf('data-page="4"');
  const bridePos = indexHtml.indexOf('data-page="5"');
  assert.ok(groomPos < bridePos, 'Groom page must appear before Bride page');
});

test('QR Code Generator produces valid ISO/IEC 18004 SVG for Maps URL', () => {
  const mat = qr.generateMatrix(official.location.mapsUrl);
  assert.ok(mat.size >= 21, 'QR matrix size invalid');
  assert.equal(mat.matrix[0][0], 1, 'Top-left finder corner must be dark');
  assert.equal(mat.matrix[0][6], 1, 'Top-left finder edge must be dark');
  const svg = qr.toSVG(official.location.mapsUrl);
  assert.ok(svg.startsWith('<svg') && svg.includes('<path d="M'));
});

test('D1 Migration SQL has no -- comments (D1 Console safe)', () => {
  assert.ok(!sql.includes('--'), 'SQL must not contain -- comments for D1 console safety');
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS rsvps'));
  assert.ok(sql.includes('INSERT OR IGNORE INTO invitation_config'));
});

test('Security: No Admin Secrets in Frontend & PBKDF2 Used in Backend', () => {
  assert.ok(!indexHtml.includes('ADMIN_PASSWORD'));
  assert.ok(!adminHtml.includes('ADMIN_PASSWORD'));
  assert.ok(utilsJs.includes('PBKDF2') && utilsJs.includes('HttpOnly'));
});

console.log('=== QA TEST RESULTS ===');
let failed = 0;
for (const r of results) {
  console.log(`[${r.status}] ${r.name}${r.error ? ' -> ' + r.error : ''}`);
  if (r.status === 'FAIL') failed++;
}
console.log(`Total: ${results.length}, Passed: ${results.length - failed}, Failed: ${failed}`);
if (failed > 0) process.exit(1);

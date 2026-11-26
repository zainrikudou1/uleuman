const COOKIE_NAME = 'ivory_admin_session';

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders
    }
  });
}

export function sanitizeStr(val, maxLen = 200) {
  return String(val ?? '').replace(/[<>]/g, '').trim().slice(0, maxLen);
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  const parts = String(storedHash).split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') {
    return false;
  }
  const iterations = parseInt(parts[1], 10);
  const salt = parts[2];
  const expectedHex = parts[3];
  if (!iterations || iterations < 10000) return false;

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  const derivedHex = toHex(bits);
  return timingSafeEqual(derivedHex, expectedHex);
}

async function hmacSign(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return toHex(sig);
}

export async function createSessionCookie(secret, ttlSeconds = 86400) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `admin.${exp}`;
  const sig = await hmacSign(payload, secret);
  const token = `${payload}.${sig}`;
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${ttlSeconds}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export async function requireAdmin(request, env) {
  const secret = env.ADMIN_SESSION_SECRET;
  if (!secret) return false;
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;
  const parts = match[1].split('.');
  if (parts.length !== 3) return false;
  const [role, expStr, sig] = parts;
  const exp = parseInt(expStr, 10);
  if (role !== 'admin' || !exp || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = await hmacSign(`${role}.${expStr}`, secret);
  return timingSafeEqual(sig, expected);
}

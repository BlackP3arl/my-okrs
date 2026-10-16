const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SESSION_COOKIE = 'okr_session';
const STATE_COOKIE = 'okr_oauth_state';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function bytesToBase64Url(bytes) {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const byte of array) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64UrlToBytes(value) {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (value.length % 4)) % 4);
  return Uint8Array.from(atob(padded), char => char.charCodeAt(0));
}

function timingSafeEqual(left, right) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function signToken(secret, payload) {
  const body = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return `${body}.${bytesToBase64Url(signature)}`;
}

async function verifyToken(secret, token) {
  const [body, signature] = String(token || '').split('.');
  if (!body || !signature) return null;
  const key = await hmacKey(secret);
  const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(body)));
  const actual = base64UrlToBytes(signature);
  if (!timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(decoder.decode(base64UrlToBytes(body)));
    if (!payload?.email || !payload.exp || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readCookies(request) {
  const header = request.headers.get('Cookie') || '';
  const cookies = {};
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!name) continue;
    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }
  return cookies;
}

function cookieBase(request, maxAge) {
  const secure = new URL(request.url).protocol === 'https:';
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

export function setCookie(name, value, request, maxAge) {
  return `${name}=${encodeURIComponent(value)}; ${cookieBase(request, maxAge)}`;
}

export function clearCookie(name, request) {
  return `${name}=; ${cookieBase(request, 0)}`;
}

export async function createSessionCookie(env, request, email) {
  const token = await signToken(requireSecret(env), {
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  });
  return setCookie(SESSION_COOKIE, token, request, SESSION_MAX_AGE);
}

export async function readSession(env, request) {
  try {
    requireSecret(env);
  } catch {
    return null;
  }
  const token = readCookies(request)[SESSION_COOKIE];
  const payload = await verifyToken(env.SESSION_SECRET, token);
  return payload?.email ? payload : null;
}

export async function createStateCookie(env, request) {
  const state = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const token = await signToken(requireSecret(env), {
    state,
    exp: Math.floor(Date.now() / 1000) + 600,
  });
  return { state, cookie: setCookie(STATE_COOKIE, token, request, 600) };
}

export async function readStateCookie(env, request) {
  const token = readCookies(request)[STATE_COOKIE];
  const payload = await verifyToken(env.SESSION_SECRET, token);
  return payload?.state || null;
}

export function clearAuthCookies(request) {
  return [clearCookie(SESSION_COOKIE, request), clearCookie(STATE_COOKIE, request)];
}

export function requireSecret(env) {
  const secret = env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not configured.');
  return secret;
}

export function googleConfig(env) {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Google authentication is not configured.');
  }
  return { clientId, clientSecret };
}

export function originOf(request) {
  return new URL(request.url).origin;
}

export function callbackUrl(request) {
  return `${originOf(request)}/api/auth/callback`;
}

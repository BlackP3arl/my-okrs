import { json, withCookies } from '../../_lib/http.js';
import { clearAuthCookies } from '../../_lib/session.js';

export async function onRequest(context) {
  if (context.request.method !== 'POST' && context.request.method !== 'GET') {
    return json({ error: 'Method not allowed.' }, 405);
  }
  return withCookies(json({ ok: true }), clearAuthCookies(context.request));
}

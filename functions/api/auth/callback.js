import { getDb, findUserByEmail } from '../../_lib/db.js';
import { json, redirect, withCookies } from '../../_lib/http.js';
import { normalizeEmail } from '../../../src/authPolicy.js';
import {
  callbackUrl,
  clearCookie,
  createSessionCookie,
  googleConfig,
  originOf,
  readStateCookie,
} from '../../_lib/session.js';

function fail(request, code) {
  return withCookies(redirect(`${originOf(request)}/?error=${code}`), [
    clearCookie('okr_oauth_state', request),
  ]);
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expected = await readStateCookie(env, request);
  if (!code || !state || !expected || state !== expected) return fail(request, 'google');

  const db = await getDb(env);
  if (!db) return json({ error: 'D1 binding DB is not configured.' }, 503);

  try {
    const { clientId, clientSecret } = googleConfig(env);
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl(request),
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenResponse.ok) return fail(request, 'google');
    const tokens = await tokenResponse.json();
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userResponse.ok) return fail(request, 'google');
    const profile = await userResponse.json();
    const email = normalizeEmail(profile.email);
    if (!email || profile.email_verified === false) return fail(request, 'google');

    const user = await findUserByEmail(db, email);
    if (!user) return fail(request, 'unauthorized');

    await db.prepare('UPDATE users SET last_login_at = datetime(\'now\') WHERE id = ?1').bind(user.id).run();
    const session = await createSessionCookie(env, request, user.email);
    return withCookies(redirect(`${originOf(request)}/`), [
      session,
      clearCookie('okr_oauth_state', request),
    ]);
  } catch {
    return fail(request, 'google');
  }
}

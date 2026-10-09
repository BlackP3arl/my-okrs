import { json, redirect, withCookies } from '../../_lib/http.js';
import { callbackUrl, createStateCookie, googleConfig } from '../../_lib/session.js';

export async function onRequestGet(context) {
  try {
    const { clientId } = googleConfig(context.env);
    const { state, cookie } = await createStateCookie(context.env, context.request);
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', callbackUrl(context.request));
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    url.searchParams.set('prompt', 'select_account');
    url.searchParams.set('access_type', 'online');
    return withCookies(redirect(url.toString()), [cookie]);
  } catch (error) {
    return json({ error: error.message || 'Google authentication is not configured.' }, 500);
  }
}

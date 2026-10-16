import { DEFAULT_ADMIN_EMAIL } from './authPolicy.js';

export const LOGIN_ERRORS = {
  unauthorized: 'This Google account is not authorised. Ask an admin to add your email.',
  google: 'Google sign-in did not complete. Try again.',
};

const jsonHeaders = { accept: 'application/json' };

async function readJson(response) {
  const type = response.headers.get('content-type') || '';
  if (!type.includes('application/json')) return {};
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export function localDevUser() {
  return {
    id: 0,
    email: DEFAULT_ADMIN_EMAIL,
    fullName: 'Local developer',
    role: 'admin',
    protected: true,
    localDev: true,
  };
}

export async function fetchSession() {
  const response = await fetch('/api/auth/me', { headers: jsonHeaders, credentials: 'include' });
  if (response.status === 401) return { user: null, reachable: true };
  const body = await readJson(response);
  if (!response.ok) {
    const error = new Error(body.error || 'Could not check sign-in.');
    error.unreachable = response.status === 404 || response.status >= 500;
    throw error;
  }
  return { user: body.user || null, reachable: true };
}

export function startGoogleLogin() {
  window.location.assign('/api/auth/login');
}

export async function signOutRequest() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}

async function send(url, method, payload) {
  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers: payload ? { ...jsonHeaders, 'content-type': 'application/json' } : jsonHeaders,
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const body = await readJson(response);
  if (!response.ok) throw new Error(body.error || 'The request could not be completed.');
  return body;
}

export function fetchUsers() {
  return send('/api/users', 'GET').then(body => body.users || []);
}

export function createUser(payload) {
  return send('/api/users', 'POST', payload).then(body => body.user);
}

export function updateUser(id, payload) {
  return send(`/api/users/${id}`, 'PATCH', payload).then(body => body.user);
}

export function deleteUser(id) {
  return send(`/api/users/${id}`, 'DELETE');
}

import { getDb, isResponse, listUsers, requireAdmin } from '../_lib/db.js';
import { json } from '../_lib/http.js';
import { parseUserInput, publicUser } from '../../src/authPolicy.js';

export async function onRequest(context) {
  const { request, env } = context;
  const db = await getDb(env);
  if (!db) return json({ error: 'D1 binding DB is not configured.' }, 503);
  const actor = await requireAdmin(context, db);
  if (isResponse(actor)) return actor;

  if (request.method === 'GET') {
    return json({ users: await listUsers(db) });
  }

  if (request.method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Expected JSON with full name, email, and role.' }, 400);
    }
    const parsed = parseUserInput(body);
    if (parsed.errors.length) return json({ error: parsed.errors[0] }, 400);
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?1').bind(parsed.email).first();
    if (existing) return json({ error: 'That email is already in the user list.' }, 409);
    const result = await db.prepare(
      `INSERT INTO users (email, full_name, role, created_at)
       VALUES (?1, ?2, ?3, datetime('now'))
       RETURNING *`,
    ).bind(parsed.email, parsed.fullName, parsed.role).first();
    return json({ user: publicUser(result) }, 201);
  }

  return json({ error: 'Method not allowed.' }, 405);
}

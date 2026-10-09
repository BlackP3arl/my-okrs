import { getDb, isResponse, requireAdmin } from '../../_lib/db.js';
import { json } from '../../_lib/http.js';
import { parseUserInput, publicUser, userChangeError } from '../../../src/authPolicy.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  const db = await getDb(env);
  if (!db) return json({ error: 'D1 binding DB is not configured.' }, 503);
  const actor = await requireAdmin(context, db);
  if (isResponse(actor)) return actor;

  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) return json({ error: 'That user was not found.' }, 404);
  const target = await db.prepare('SELECT * FROM users WHERE id = ?1').bind(id).first();
  if (!target) return json({ error: 'That user was not found.' }, 404);

  if (request.method === 'PATCH') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Expected JSON with full name or role.' }, 400);
    }
    const parsed = parseUserInput(body, { partial: true });
    if (parsed.errors.length) return json({ error: parsed.errors[0] }, 400);
    const error = userChangeError(actor, target, { role: parsed.role });
    if (error) return json({ error }, 403);
    const fullName = parsed.fullName ?? target.full_name;
    const role = parsed.role ?? target.role;
    const row = await db.prepare(
      'UPDATE users SET full_name = ?1, role = ?2 WHERE id = ?3 RETURNING *',
    ).bind(fullName, role, id).first();
    return json({ user: publicUser(row) });
  }

  if (request.method === 'DELETE') {
    const error = userChangeError(actor, target, { delete: true });
    if (error) return json({ error }, 403);
    await db.prepare('DELETE FROM users WHERE id = ?1').bind(id).run();
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed.' }, 405);
}

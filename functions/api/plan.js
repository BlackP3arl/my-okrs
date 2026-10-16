import { getDb, isResponse, requireUser } from '../_lib/db.js';
import { json } from '../_lib/http.js';

function isPlan(value) {
  return Boolean(
    value
    && Array.isArray(value.pillars) && value.pillars.length
    && Array.isArray(value.goals) && value.goals.length
    && Array.isArray(value.objectives)
    && Array.isArray(value.keyResults)
    && Array.isArray(value.krMeans),
  );
}

export async function onRequest(context) {
  const { request, env } = context;
  const db = await getDb(env);
  if (!db) return json({ error: 'D1 binding DB is not configured.' }, 503);
  const user = await requireUser(context, db);
  if (isResponse(user)) return user;

  if (request.method === 'GET') {
    const row = await db.prepare('SELECT data FROM plan WHERE id = 1').first();
    if (!row?.data) return json({ plan: null });
    try {
      const plan = JSON.parse(row.data);
      if (!isPlan(plan)) return json({ plan: null });
      return json({ plan });
    } catch {
      return json({ plan: null });
    }
  }

  if (request.method === 'PUT') {
    if (user.role !== 'admin') return json({ error: 'Viewers cannot change the plan.' }, 403);
    let plan;
    try {
      plan = await request.json();
    } catch {
      return json({ error: 'Expected a JSON plan.' }, 400);
    }
    if (!isPlan(plan)) return json({ error: 'The plan is missing its strategy records.' }, 400);
    const data = JSON.stringify(plan);
    await db.prepare(`INSERT INTO plan (id, data, updated_at) VALUES (1, ?1, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`).bind(data).run();
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed.' }, 405);
}

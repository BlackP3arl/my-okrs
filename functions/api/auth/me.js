import { currentUser, getDb } from '../../_lib/db.js';
import { json } from '../../_lib/http.js';
import { publicUser } from '../../../src/authPolicy.js';

export async function onRequestGet(context) {
  const db = await getDb(context.env);
  if (!db) return json({ error: 'D1 binding DB is not configured.' }, 503);
  const user = await currentUser(context, db);
  if (!user) return json({ user: null }, 401);
  return json({ user: publicUser(user) });
}

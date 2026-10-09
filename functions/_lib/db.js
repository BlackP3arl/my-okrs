import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_NAME, normalizeEmail, publicUser } from '../../src/authPolicy.js';
import { json } from './http.js';
import { readSession } from './session.js';

const PLAN_SCHEMA = `CREATE TABLE IF NOT EXISTS plan (
  id INTEGER PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;

const USERS_SCHEMA = `CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'viewer')),
  created_at TEXT NOT NULL,
  last_login_at TEXT
)`;

export async function getDb(env) {
  const db = env.DB;
  if (!db) return null;
  await db.prepare(PLAN_SCHEMA).run();
  await db.prepare(USERS_SCHEMA).run();
  await db.prepare(
    `INSERT INTO users (email, full_name, role, created_at)
     SELECT ?1, ?2, 'admin', datetime('now')
     WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = ?1)`,
  ).bind(DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_NAME).run();
  return db;
}

export async function findUserByEmail(db, email) {
  return db.prepare('SELECT * FROM users WHERE email = ?1').bind(normalizeEmail(email)).first();
}

export async function listUsers(db) {
  const result = await db.prepare(
    `SELECT * FROM users
     ORDER BY CASE WHEN email = ?1 THEN 0 ELSE 1 END, full_name COLLATE NOCASE`,
  ).bind(DEFAULT_ADMIN_EMAIL).all();
  return (result.results || []).map(publicUser);
}

export async function currentUser(context, db) {
  const session = await readSession(context.env, context.request);
  if (!session?.email) return null;
  return findUserByEmail(db, session.email);
}

export async function requireUser(context, db) {
  const user = await currentUser(context, db);
  if (!user) return json({ error: 'Sign in required.' }, 401);
  return user;
}

export async function requireAdmin(context, db) {
  const user = await requireUser(context, db);
  if (user instanceof Response) return user;
  if (user.role !== 'admin') return json({ error: 'Only an admin can manage users.' }, 403);
  return user;
}

export function isResponse(value) {
  return value instanceof Response;
}

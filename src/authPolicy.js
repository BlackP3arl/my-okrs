export const DEFAULT_ADMIN_EMAIL = 'salle.kma@gmail.com';
export const DEFAULT_ADMIN_NAME = 'Salle';
export const ROLES = ['admin', 'viewer'];

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function isDefaultAdmin(email) {
  return normalizeEmail(email) === DEFAULT_ADMIN_EMAIL;
}

export function isAdminRole(role) {
  return role === 'admin';
}

export function parseUserInput(body, { partial = false } = {}) {
  const email = body?.email === undefined ? undefined : normalizeEmail(body.email);
  const fullName = body?.fullName === undefined ? undefined : String(body.fullName).trim();
  const role = body?.role === undefined ? undefined : String(body.role).trim().toLowerCase();
  const errors = [];

  if (!partial || body?.email !== undefined) {
    if (!isValidEmail(email)) errors.push('Enter a valid Google email address.');
  }
  if (!partial || body?.fullName !== undefined) {
    if (!fullName || fullName.length > 120) errors.push('Enter the user’s full name.');
  }
  if (!partial) {
    if (role && !ROLES.includes(role)) errors.push('Role must be admin or viewer.');
  } else if (role !== undefined && !ROLES.includes(role)) {
    errors.push('Role must be admin or viewer.');
  }

  return {
    email,
    fullName,
    role: role || (partial ? undefined : 'viewer'),
    errors,
  };
}

export function userChangeError(actor, target, patch = {}) {
  if (!isAdminRole(actor?.role)) return 'Only an admin can manage users.';
  if (!target) return 'That user was not found.';
  if (isDefaultAdmin(target.email)) {
    if (patch.delete) return 'The default admin account cannot be removed.';
    if (patch.role && patch.role !== 'admin') return 'The default admin account cannot be demoted.';
  }
  return null;
}

export function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name ?? row.fullName,
    role: row.role,
    createdAt: row.created_at ?? row.createdAt ?? null,
    lastLoginAt: row.last_login_at ?? row.lastLoginAt ?? null,
    protected: isDefaultAdmin(row.email),
  };
}

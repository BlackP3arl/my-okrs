import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_ADMIN_EMAIL,
  isDefaultAdmin,
  parseUserInput,
  publicUser,
  userChangeError,
} from './authPolicy.js';

const admin = { email: DEFAULT_ADMIN_EMAIL, role: 'admin' };
const otherAdmin = { email: 'lead@example.com', role: 'admin' };
const viewer = { email: 'reader@example.com', role: 'viewer' };
const defaultRow = { id: 1, email: DEFAULT_ADMIN_EMAIL, full_name: 'Salle', role: 'admin' };
const memberRow = { id: 2, email: 'reader@example.com', full_name: 'Alex Reader', role: 'viewer' };

describe('parseUserInput', () => {
  it('requires a Google email and a full name', () => {
    const empty = parseUserInput({});
    assert.deepEqual(empty.errors, ['Enter a valid Google email address.', 'Enter the user’s full name.']);
  });

  it('normalises email and defaults the role to viewer', () => {
    const parsed = parseUserInput({ email: ' Alex.Reader@Gmail.com ', fullName: 'Alex Reader' });
    assert.equal(parsed.errors.length, 0);
    assert.equal(parsed.email, 'alex.reader@gmail.com');
    assert.equal(parsed.fullName, 'Alex Reader');
    assert.equal(parsed.role, 'viewer');
  });

  it('accepts an admin role', () => {
    const parsed = parseUserInput({ email: 'lead@example.com', fullName: 'Strategy Lead', role: 'admin' });
    assert.equal(parsed.errors.length, 0);
    assert.equal(parsed.role, 'admin');
  });
});

describe('default admin protection', () => {
  it('recognises the seeded admin email without regard to case', () => {
    assert.equal(isDefaultAdmin('Salle.kma@gmail.com'), true);
    assert.equal(isDefaultAdmin('salle.kma@gmail.com'), true);
    assert.equal(isDefaultAdmin('other@gmail.com'), false);
  });

  it('blocks removing or demoting the default admin', () => {
    assert.equal(userChangeError(otherAdmin, defaultRow, { delete: true }), 'The default admin account cannot be removed.');
    assert.equal(userChangeError(otherAdmin, defaultRow, { role: 'viewer' }), 'The default admin account cannot be demoted.');
    assert.equal(userChangeError(otherAdmin, defaultRow, { fullName: 'Salle KMA' }), null);
  });

  it('lets an admin add, demote, or remove other users', () => {
    assert.equal(userChangeError(admin, memberRow, { role: 'admin' }), null);
    assert.equal(userChangeError(admin, { ...memberRow, role: 'admin' }, { role: 'viewer' }), null);
    assert.equal(userChangeError(admin, memberRow, { delete: true }), null);
  });

  it('stops a viewer from managing users', () => {
    assert.equal(userChangeError(viewer, memberRow, { delete: true }), 'Only an admin can manage users.');
  });

  it('marks the default admin as protected in the public payload', () => {
    assert.equal(publicUser(defaultRow).protected, true);
    assert.equal(publicUser(memberRow).protected, false);
    assert.equal(publicUser(memberRow).fullName, 'Alex Reader');
  });
});

import { useEffect, useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { createUser, deleteUser, fetchUsers, updateUser } from './authClient.js';
import { useAuth } from './authContext.js';
import { Empty, Field } from './ui.jsx';

const blankForm = { fullName: '', email: '', role: 'viewer' };

function lastSeen(value) {
  if (!value) return 'Never signed in';
  const date = new Date(`${value}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function UsersPage() {
  const { apiReady } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(apiReady);

  const flash = (message, kind = 'note') => {
    setError(kind === 'error' ? message : '');
    setNote(kind === 'note' ? message : '');
    window.setTimeout(() => {
      setNote(current => (current === message ? '' : current));
      setError(current => (current === message ? '' : current));
    }, 2800);
  };

  const refresh = () => {
    setLoading(true);
    return fetchUsers()
      .then(setUsers)
      .catch(failure => flash(failure.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!apiReady) return undefined;
    let cancelled = false;
    fetchUsers()
      .then(rows => { if (!cancelled) setUsers(rows); })
      .catch(failure => { if (!cancelled) { setError(failure.message); setNote(''); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [apiReady]);

  const add = event => {
    event.preventDefault();
    createUser(form)
      .then(() => {
        setForm(blankForm);
        flash('User added');
        return refresh();
      })
      .catch(failure => flash(failure.message, 'error'));
  };

  const changeRole = (user, role) => {
    if (user.protected || user.role === role) return;
    updateUser(user.id, { role })
      .then(() => {
        flash('Role updated');
        return refresh();
      })
      .catch(failure => flash(failure.message, 'error'));
  };

  const remove = user => {
    if (user.protected) return;
    if (!window.confirm(`Remove ${user.fullName} (${user.email}) from the workspace? They will no longer be able to sign in.`)) return;
    deleteUser(user.id)
      .then(() => {
        flash('User removed');
        return refresh();
      })
      .catch(failure => flash(failure.message, 'error'));
  };

  return (
    <section className="content">
      <div className="hero">
        <div>
          <div className="eyebrow">USERS</div>
          <h1>Who can sign in</h1>
          <p>Add a person’s full name and Google email. They can open this workspace only after Google confirms that same address. Admins can change the plan. Viewers can see everything and cannot edit it.</p>
        </div>
        {(note || error) && <div className={error ? 'settings-error' : 'settings-saved'}>{error || note}</div>}
      </div>
      {!apiReady && (
        <article className="module-card restore-card">
          <div>
            <b>User management needs the hosted API</b>
            <p>Google sign-in and the user list run on Cloudflare Pages. Local Vite uses a developer identity and does not keep the shared user table.</p>
          </div>
        </article>
      )}
      {apiReady && (
        <>
          <article className="module-card">
            <div className="module-card-head"><div><b>Add a user</b><span>Full name and Google email are stored together. Role controls whether they can edit.</span></div></div>
            <form className="settings-form users-form" onSubmit={add}>
              <Field label="Full name"><input value={form.fullName} onChange={event => setForm(current => ({ ...current, fullName: event.target.value }))} required placeholder="Aishath Mohamed" /></Field>
              <Field label="Google email"><input type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} required placeholder="name@gmail.com" /></Field>
              <Field label="Role">
                <select value={form.role} onChange={event => setForm(current => ({ ...current, role: event.target.value }))}>
                  <option value="viewer">Viewer — full view, no edits</option>
                  <option value="admin">Admin — add, change, and remove</option>
                </select>
              </Field>
              <div className="form-actions"><button className="primary" type="submit"><Plus size={16} /> Add user</button></div>
            </form>
          </article>
          <div className="register user-register">
            <div className="register-row head user-row"><span>Name</span><span>Google email</span><span>Role</span><span>Last sign-in</span><span /></div>
            {users.map(user => (
              <div key={user.id} className="register-row user-row">
                <div>
                  <b>{user.fullName}</b>
                  {user.protected && <small>Default admin</small>}
                </div>
                <span>{user.email}</span>
                <label className="user-role">
                  <select
                    value={user.role}
                    disabled={user.protected}
                    aria-label={`Role for ${user.fullName}`}
                    onChange={event => changeRole(user, event.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </label>
                <span>{lastSeen(user.lastLoginAt)}</span>
                {user.protected
                  ? <small>Protected</small>
                  : <button type="button" className="icon-button danger-icon" aria-label={`Remove ${user.fullName}`} onClick={() => remove(user)}><Trash2 size={16} /></button>}
              </div>
            ))}
            {!loading && !users.length && <Empty title="No users yet" detail="Add a Google email to allow that person to sign in." />}
          </div>
        </>
      )}
      {loading && apiReady && (
        <p className="result-count"><Users size={14} /> Loading users…</p>
      )}
    </section>
  );
}

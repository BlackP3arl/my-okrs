import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from './authContext.js';
import { fetchSession, localDevUser, LOGIN_ERRORS, signOutRequest, startGoogleLogin } from './authClient.js';
import { resetPlanCache } from './planClient.js';

export function AuthGate({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    fetchSession()
      .then(({ user: next }) => setUser(next))
      .catch(() => {
        setUser(import.meta.env.DEV ? localDevUser() : null);
      });
  }, []);

  const value = useMemo(() => {
    if (!user) return null;
    return {
      user,
      canEdit: user.role === 'admin',
      isAdmin: user.role === 'admin',
      apiReady: !user.localDev,
      async signOut() {
        resetPlanCache();
        if (!user.localDev) await signOutRequest();
        window.location.assign('/');
      },
    };
  }, [user]);

  if (user === undefined) {
    return <div className="boot">Checking your sign-in…</div>;
  }
  if (!user) return <LoginPage />;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function loginError() {
  const params = new URLSearchParams(window.location.search);
  return LOGIN_ERRORS[params.get('error')] || '';
}

function LoginPage() {
  const [message] = useState(loginError);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('error')) {
      window.history.replaceState({}, '', '/');
    }
  }, []);
  return (
    <div className="login-screen">
      <div className="login-card">
        <img className="login-logo" src="/brand/mpao-logo-color.png" alt="Maldives Pension Office" />
        <p className="login-kicker">Strategy workspace</p>
        <h1>Sign in to continue</h1>
        <p>Use a Google account that an admin has added to this workspace. New Google accounts cannot register themselves.</p>
        {message && <p className="login-error" role="alert">{message}</p>}
        <button type="button" className="google-button" onClick={startGoogleLogin}>
          <GoogleMark />
          Continue with Google
        </button>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

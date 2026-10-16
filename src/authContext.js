import { createContext, useContext } from 'react';

export const AuthContext = createContext({
  user: null,
  canEdit: false,
  isAdmin: false,
  apiReady: false,
  signOut: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

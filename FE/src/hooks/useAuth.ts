import { useEffect, useState } from 'react';

type Role = 'user' | 'owner' | 'admin';

export type AuthState = {
  isLoggedIn: boolean;
  role: Role | null;
  token: string | null;
};

const readAuthState = (): AuthState => {
  const token = localStorage.getItem('accessToken')?.trim() ?? '';
  if (!token || token === 'undefined' || token === 'null') {
    return { isLoggedIn: false, role: null, token: null };
  }
  try {
    const raw = localStorage.getItem('currentUser');
    const user = raw ? (JSON.parse(raw) as { role?: Role }) : null;
    return { isLoggedIn: true, role: user?.role ?? null, token };
  } catch {
    return { isLoggedIn: true, role: null, token };
  }
};

/**
 * Returns the current auth state and re-renders whenever
 * localStorage changes (logout, login from another tab, etc.)
 */
export const useAuth = (): AuthState => {
  const [auth, setAuth] = useState<AuthState>(readAuthState);

  useEffect(() => {
    const sync = () => setAuth(readAuthState());

    // Fired by Header.handleLogout / LoginPage / RegisterPage
    window.addEventListener('storage', sync);
    window.addEventListener('currentUserUpdated', sync);

    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('currentUserUpdated', sync);
    };
  }, []);

  return auth;
};

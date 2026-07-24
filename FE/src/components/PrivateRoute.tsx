import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getCurrentUserProfile } from '../Axios/Axios';

type Props = {
  /** The component/element to render when access is allowed */
  children: React.ReactNode;
  /**
   * Which roles are allowed to visit this route.
   * Omit (or pass undefined) to allow any authenticated user.
   */
  allowedRoles?: Array<'user' | 'owner' | 'admin'>;
  /** Where to redirect unauthenticated visitors. Defaults to /login */
  redirectTo?: string;
};

/**
 * PrivateRoute — wraps protected pages.
 *
 * Behaviour:
 * - Not logged in  → redirect to /login (saves current path so we can come back)
 * - Logged in, wrong role → redirect to /home
 * - Logged in, correct role → render children
 *
 * Because it reads from localStorage on every render it also covers the
 * "press Back after logout" case: the token is gone, so the user is
 * immediately redirected instead of seeing the cached screen.
 */
export const PrivateRoute: React.FC<Props> = ({
  children,
  allowedRoles,
  redirectTo = '/login',
}) => {
  const auth = useAuth();
  const location = useLocation();
  // The cached role in localStorage can go stale if it was changed on the
  // backend (e.g. promoted to admin) after this session's last login/refresh.
  // Refetch the live profile once per role-restricted route mount so we
  // don't bounce the user based on a stale cached role.
  const [roleChecked, setRoleChecked] = useState(!allowedRoles);

  // Push the browser back-stack so the history entry is still there
  // but navigating forward after logout shows /login, not the cached page.
  useEffect(() => {
    if (!auth.isLoggedIn) {
      // Replace the current history entry so Back goes to the page BEFORE
      // the protected one, not back to the protected route itself.
      window.history.replaceState(null, '', redirectTo);
    }
  }, [auth.isLoggedIn, redirectTo]);

  useEffect(() => {
    if (!allowedRoles || !auth.isLoggedIn) {
      return;
    }
    let cancelled = false;
    setRoleChecked(false);
    getCurrentUserProfile()
      .then(({ user }) => {
        if (cancelled) return;
        const raw = localStorage.getItem('currentUser');
        const cached = raw ? (JSON.parse(raw) as { role?: string }) : null;
        if (cached?.role !== user.role) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          window.dispatchEvent(new Event('currentUserUpdated'));
        }
      })
      .catch(() => {
        // Network/auth errors here are handled by the axios interceptor
        // (401 clears the session); nothing extra to do on failure.
      })
      .finally(() => {
        if (!cancelled) setRoleChecked(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedRoles, auth.isLoggedIn, location.pathname]);

  if (!auth.isLoggedIn) {
    // Preserve the intended destination so we can redirect after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (!roleChecked) {
    return null;
  }

  if (allowedRoles && auth.role && !allowedRoles.includes(auth.role)) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

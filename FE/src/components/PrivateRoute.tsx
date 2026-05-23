import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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

  // Push the browser back-stack so the history entry is still there
  // but navigating forward after logout shows /login, not the cached page.
  useEffect(() => {
    if (!auth.isLoggedIn) {
      // Replace the current history entry so Back goes to the page BEFORE
      // the protected one, not back to the protected route itself.
      window.history.replaceState(null, '', redirectTo);
    }
  }, [auth.isLoggedIn, redirectTo]);

  if (!auth.isLoggedIn) {
    // Preserve the intended destination so we can redirect after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles && auth.role && !allowedRoles.includes(auth.role)) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

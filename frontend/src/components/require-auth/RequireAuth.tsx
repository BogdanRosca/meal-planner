import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../config/routes';
import styles from './RequireAuth.module.css';

function RequireAuth() {
  const { state } = useAuth();
  const location = useLocation();

  if (state.status === 'loading') {
    return (
      <p className={styles.loading} role="status">
        Loading…
      </p>
    );
  }

  if (state.status === 'anonymous') {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}

export default RequireAuth;

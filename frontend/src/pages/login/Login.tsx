import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { InvalidCredentialsError } from '../../services/authService';
import { ROUTES } from '../../config/routes';
import styles from './Login.module.css';

const ERROR_ID = 'login-error';

const redirectTarget = (state: unknown): string => {
  if (
    typeof state === 'object' &&
    state !== null &&
    'from' in state &&
    typeof state.from === 'string' &&
    state.from !== ROUTES.LOGIN
  ) {
    return state.from;
  }
  return ROUTES.MEAL_PLANNER;
};

function Login() {
  const { state, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (state.status === 'authenticated') {
    return <Navigate to={redirectTarget(location.state)} replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(
        err instanceof InvalidCredentialsError
          ? err.message
          : 'Could not log in. Please try again.'
      );
      setSubmitting(false);
    }
  };

  const describedBy = error ? ERROR_ID : undefined;

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit} noValidate>
        <div className={styles.brand}>
          <span className={styles['brand-icon']} aria-hidden="true">
            🍴
          </span>
          <span className={styles['brand-name']}>MealCraft</span>
        </div>
        <h1 className={styles.title}>Log in</h1>

        <label className={styles.label} htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          className={styles.input}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />

        <label className={styles.label} htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          className={styles.input}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />

        {error && (
          <p id={ERROR_ID} className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className={styles.submit}
          disabled={submitting || !email || !password}
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}

export default Login;

import React, { createContext, useCallback, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { setUnauthorizedHandler } from '../services/apiClient';
import { User } from '../types/auth';

export type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: User }
  | { status: 'anonymous' };

export interface AuthContextValue {
  state: AuthState;
  login: (_email: string, _password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    setUnauthorizedHandler(() => setState({ status: 'anonymous' }));

    authService
      .me()
      .then(user => {
        if (cancelled) return;
        setState(
          user ? { status: 'authenticated', user } : { status: 'anonymous' }
        );
      })
      .catch(() => {
        // API unreachable: show the login page, which reports errors on submit
        if (!cancelled) setState({ status: 'anonymous' });
      });

    return () => {
      cancelled = true;
      setUnauthorizedHandler(null);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const user = await authService.login(email, password);
    setState({ status: 'authenticated', user });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setState({ status: 'anonymous' });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

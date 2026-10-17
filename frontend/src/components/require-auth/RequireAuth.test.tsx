import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import RequireAuth from './RequireAuth';
import { AuthContext, AuthState } from '../../context/AuthContext';

function LoginProbe() {
  const location = useLocation();
  return <p>login page from {JSON.stringify(location.state)}</p>;
}

const renderGuard = (state: AuthState, path = '/recipes?tab=all') =>
  render(
    <AuthContext.Provider
      value={{ state, login: jest.fn(), logout: jest.fn() }}
    >
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route element={<RequireAuth />}>
            <Route path="/recipes" element={<p>protected content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('RequireAuth', () => {
  it('shows a loading status while the session is being checked', () => {
    renderGuard({ status: 'loading' });

    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('redirects anonymous users to login, remembering where they were going', () => {
    renderGuard({ status: 'anonymous' });

    expect(
      screen.getByText('login page from {"from":"/recipes?tab=all"}')
    ).toBeInTheDocument();
  });

  it('renders the protected page for logged-in users', () => {
    renderGuard({
      status: 'authenticated',
      user: { id: 1, email: 'cook@example.com' },
    });

    expect(screen.getByText('protected content')).toBeInTheDocument();
  });
});

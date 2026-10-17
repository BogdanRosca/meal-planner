import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Login from './Login';
import { AuthContext, AuthState } from '../../context/AuthContext';
import { InvalidCredentialsError } from '../../services/authService';

const renderLogin = (
  state: AuthState,
  login = jest.fn(),
  routerState: unknown = undefined
) =>
  render(
    <AuthContext.Provider value={{ state, login, logout: jest.fn() }}>
      <MemoryRouter
        initialEntries={[{ pathname: '/login', state: routerState }]}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/meal-planner" element={<p>meal planner page</p>} />
          <Route path="/recipes" element={<p>recipes page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

const fillAndSubmit = (email = 'cook@example.com', password = 'secret') => {
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
};

const anonymous: AuthState = { status: 'anonymous' };
const authenticated: AuthState = {
  status: 'authenticated',
  user: { id: 1, email: 'cook@example.com' },
};

describe('Login', () => {
  it('renders a labelled email and password form', () => {
    renderLogin(anonymous);

    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password'
    );
  });

  it('keeps submit disabled until both fields are filled', () => {
    renderLogin(anonymous);
    const submit = screen.getByRole('button', { name: 'Log in' });

    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'cook@example.com' },
    });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' },
    });
    expect(submit).toBeEnabled();
  });

  it('submits the credentials and disables the button while waiting', async () => {
    const login = jest.fn(() => new Promise<void>(() => undefined));
    renderLogin(anonymous, login);

    fillAndSubmit();

    expect(login).toHaveBeenCalledWith('cook@example.com', 'secret');
    expect(
      await screen.findByRole('button', { name: 'Logging in…' })
    ).toBeDisabled();
  });

  it('shows an accessible error for wrong credentials', async () => {
    const login = jest.fn().mockRejectedValue(new InvalidCredentialsError());
    renderLogin(anonymous, login);

    fillAndSubmit();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid email or password');
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(
      'Invalid email or password'
    );
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled();
  });

  it('shows a generic error when the server fails', async () => {
    const login = jest.fn().mockRejectedValue(new Error('500'));
    renderLogin(anonymous, login);

    fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not log in. Please try again.'
    );
  });

  it('sends logged-in users to the meal planner by default', () => {
    renderLogin(authenticated);

    expect(screen.getByText('meal planner page')).toBeInTheDocument();
  });

  it('sends logged-in users back to the page they came from', () => {
    renderLogin(authenticated, jest.fn(), { from: '/recipes' });

    expect(screen.getByText('recipes page')).toBeInTheDocument();
  });

  it('ignores a redirect target pointing back at login', async () => {
    renderLogin(authenticated, jest.fn(), { from: '/login' });

    expect(await screen.findByText('meal planner page')).toBeInTheDocument();
  });
});

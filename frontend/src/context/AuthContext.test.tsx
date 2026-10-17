import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { AuthProvider } from './AuthContext';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { setUnauthorizedHandler } from '../services/apiClient';

jest.mock('../services/authService', () => ({
  ...jest.requireActual('../services/authService'),
  authService: { me: jest.fn(), login: jest.fn(), logout: jest.fn() },
}));
jest.mock('../services/apiClient', () => ({
  setUnauthorizedHandler: jest.fn(),
}));

const USER = { id: 7, email: 'cook@example.com' };

const mockedAuth = authService as jest.Mocked<typeof authService>;
const mockedSetHandler = setUnauthorizedHandler as jest.Mock;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const renderAuth = () => renderHook(() => useAuth(), { wrapper });

describe('AuthProvider / useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts loading, then becomes authenticated when a session exists', async () => {
    mockedAuth.me.mockResolvedValue(USER);

    const { result } = renderAuth();

    expect(result.current.state).toEqual({ status: 'loading' });
    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: 'authenticated',
        user: USER,
      })
    );
  });

  it('becomes anonymous when there is no session', async () => {
    mockedAuth.me.mockResolvedValue(null);

    const { result } = renderAuth();

    await waitFor(() =>
      expect(result.current.state).toEqual({ status: 'anonymous' })
    );
  });

  it('becomes anonymous when the API is unreachable', async () => {
    mockedAuth.me.mockRejectedValue(new Error('offline'));

    const { result } = renderAuth();

    await waitFor(() =>
      expect(result.current.state).toEqual({ status: 'anonymous' })
    );
  });

  it('logs in', async () => {
    mockedAuth.me.mockResolvedValue(null);
    mockedAuth.login.mockResolvedValue(USER);
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.state.status).toBe('anonymous'));

    await act(() => result.current.login('cook@example.com', 'secret'));

    expect(mockedAuth.login).toHaveBeenCalledWith('cook@example.com', 'secret');
    expect(result.current.state).toEqual({
      status: 'authenticated',
      user: USER,
    });
  });

  it('propagates login failures and stays anonymous', async () => {
    mockedAuth.me.mockResolvedValue(null);
    mockedAuth.login.mockRejectedValue(new Error('bad'));
    const { result } = renderAuth();
    await waitFor(() => expect(result.current.state.status).toBe('anonymous'));

    await expect(act(() => result.current.login('a@b.c', 'x'))).rejects.toThrow(
      'bad'
    );
    expect(result.current.state).toEqual({ status: 'anonymous' });
  });

  it('logs out even if the request fails', async () => {
    mockedAuth.me.mockResolvedValue(USER);
    mockedAuth.logout.mockRejectedValue(new Error('offline'));
    const { result } = renderAuth();
    await waitFor(() =>
      expect(result.current.state.status).toBe('authenticated')
    );

    await act(async () => {
      await result.current.logout().catch(() => undefined);
    });

    expect(result.current.state).toEqual({ status: 'anonymous' });
  });

  it('drops to anonymous when any API call reports 401', async () => {
    mockedAuth.me.mockResolvedValue(USER);
    const { result } = renderAuth();
    await waitFor(() =>
      expect(result.current.state.status).toBe('authenticated')
    );

    const onUnauthorized = mockedSetHandler.mock.calls[0][0];
    act(() => onUnauthorized());

    expect(result.current.state).toEqual({ status: 'anonymous' });
  });

  it('unregisters the 401 handler on unmount and ignores late responses', async () => {
    let resolveMe: (_user: typeof USER) => void = () => undefined;
    mockedAuth.me.mockReturnValue(
      new Promise(resolve => {
        resolveMe = resolve;
      })
    );
    const { unmount } = renderAuth();

    unmount();
    await act(async () => resolveMe(USER));

    expect(mockedSetHandler).toHaveBeenLastCalledWith(null);
  });

  it('throws when used outside the provider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used inside an AuthProvider'
    );
  });
});

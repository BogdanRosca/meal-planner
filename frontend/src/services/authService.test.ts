import { authService, InvalidCredentialsError } from './authService';

const USER = { id: 7, email: 'cook@example.com' };

const jsonResponse = (status: number, body: unknown) => ({
  status,
  ok: status >= 200 && status < 300,
  json: jest.fn().mockResolvedValue(body),
});

describe('authService', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  describe('me', () => {
    it('returns the logged-in user', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(200, { status: 'success', user: USER })
      );

      await expect(authService.me()).resolves.toEqual(USER);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/auth/me', {
        credentials: 'include',
      });
    });

    it('returns null when there is no session', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(401, { detail: 'nope' }));

      await expect(authService.me()).resolves.toBeNull();
    });

    it('throws on server errors', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(500, {}));

      await expect(authService.me()).rejects.toThrow('500');
    });

    it.each([
      ['no user field', { status: 'success' }],
      ['malformed user', { user: { id: '7', email: 'x' } }],
      ['non-object body', 'oops'],
    ])('rejects an unexpected body (%s)', async (_label, body) => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, body));

      await expect(authService.me()).rejects.toThrow(
        'Unexpected auth response'
      );
    });
  });

  describe('login', () => {
    it('posts credentials and returns the user', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(200, { status: 'success', user: USER })
      );

      await expect(
        authService.login('cook@example.com', 'secret')
      ).resolves.toEqual(USER);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'cook@example.com',
            password: 'secret',
          }),
          credentials: 'include',
        }
      );
    });

    it('throws InvalidCredentialsError on 401', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(401, {}));

      await expect(authService.login('a@b.c', 'x')).rejects.toBeInstanceOf(
        InvalidCredentialsError
      );
    });

    it('throws a generic error on other failures', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(500, {}));

      await expect(authService.login('a@b.c', 'x')).rejects.toThrow('500');
    });
  });

  describe('logout', () => {
    it('posts to the logout endpoint', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, {}));

      await authService.logout();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/auth/logout',
        { method: 'POST', credentials: 'include' }
      );
    });
  });
});

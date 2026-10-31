import {
  apiFetch,
  getAuthToken,
  setAuthToken,
  setUnauthorizedHandler,
} from './apiClient';

describe('apiFetch', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    setUnauthorizedHandler(null);
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it('sends the session cookie and keeps the request options', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, ok: true });

    await apiFetch('http://api/x', { method: 'POST', body: '{}' });

    expect(mockFetch).toHaveBeenCalledWith('http://api/x', {
      method: 'POST',
      body: '{}',
      credentials: 'include',
    });
  });

  it('returns the response unchanged', async () => {
    const response = { status: 404, ok: false };
    mockFetch.mockResolvedValueOnce(response);

    await expect(apiFetch('http://api/x')).resolves.toBe(response);
  });

  it('notifies the unauthorized handler on 401', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    mockFetch.mockResolvedValueOnce({ status: 401, ok: false });

    await apiFetch('http://api/x');

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not notify the handler for other statuses', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    mockFetch.mockResolvedValueOnce({ status: 500, ok: false });

    await apiFetch('http://api/x');

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('tolerates a 401 with no handler registered', async () => {
    mockFetch.mockResolvedValueOnce({ status: 401, ok: false });

    await expect(apiFetch('http://api/x')).resolves.toEqual({
      status: 401,
      ok: false,
    });
  });

  describe('bearer token', () => {
    it('sends the stored token and keeps existing headers', async () => {
      setAuthToken('abc');
      mockFetch.mockResolvedValueOnce({ status: 200, ok: true });

      await apiFetch('http://api/x', {
        headers: { 'Content-Type': 'application/json' },
      });

      const headers: Headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.get('Authorization')).toBe('Bearer abc');
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('forgets the token on 401', async () => {
      setAuthToken('expired');
      mockFetch.mockResolvedValueOnce({ status: 401, ok: false });

      await apiFetch('http://api/x');

      expect(getAuthToken()).toBeNull();
    });

    it('treats unavailable storage as having no token', async () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked');
      });

      expect(() => setAuthToken('abc')).not.toThrow();
      expect(getAuthToken()).toBeNull();
    });
  });
});

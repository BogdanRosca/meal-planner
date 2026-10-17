import { apiFetch, setUnauthorizedHandler } from './apiClient';

describe('apiFetch', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    setUnauthorizedHandler(null);
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
});

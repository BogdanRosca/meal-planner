type UnauthorizedHandler = () => void;

const TOKEN_STORAGE_KEY = 'authToken';

let unauthorizedHandler: UnauthorizedHandler | null = null;

/**
 * Called whenever the API answers 401, so an expired session sends the user
 * back to the login page no matter which request noticed it.
 */
export const setUnauthorizedHandler = (
  handler: UnauthorizedHandler | null
): void => {
  unauthorizedHandler = handler;
};

// Storage can throw (private mode, blocked site data); auth then falls back to the cookie.
export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string | null): void => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Nothing to persist to; the session cookie still covers same-site setups.
  }
};

/**
 * fetch() that authenticates every request. The bearer token is what works
 * on Safari/iOS, which drop the cross-site session cookie; the cookie is kept
 * for browsers that still send it.
 */
export const apiFetch = async (
  url: string,
  init: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  const requestInit: RequestInit = { ...init, credentials: 'include' };
  if (token) {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    requestInit.headers = headers;
  }

  const response = await fetch(url, requestInit);
  if (response.status === 401) {
    setAuthToken(null);
    unauthorizedHandler?.();
  }
  return response;
};

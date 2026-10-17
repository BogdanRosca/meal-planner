type UnauthorizedHandler = () => void;

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

/**
 * fetch() that sends the httpOnly session cookie with every request.
 */
export const apiFetch = async (
  url: string,
  init: RequestInit = {}
): Promise<Response> => {
  const response = await fetch(url, { ...init, credentials: 'include' });
  if (response.status === 401) {
    unauthorizedHandler?.();
  }
  return response;
};

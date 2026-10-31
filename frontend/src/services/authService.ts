import { API_ENDPOINTS } from '../config/api';
import { User } from '../types/auth';
import { apiFetch, setAuthToken } from './apiClient';

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

const isUser = (value: unknown): value is User =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  'email' in value &&
  typeof value.id === 'number' &&
  typeof value.email === 'string';

const userFromBody = (body: unknown): User => {
  if (typeof body === 'object' && body !== null && 'user' in body) {
    if (isUser(body.user)) {
      return body.user;
    }
  }
  throw new Error('Unexpected auth response');
};

const parseUser = async (response: Response): Promise<User> =>
  userFromBody(await response.json());

export const authService = {
  /**
   * The logged-in user, or null when there is no valid session.
   */
  async me(): Promise<User | null> {
    const response = await apiFetch(API_ENDPOINTS.AUTH_ME);
    if (response.status === 401) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return parseUser(response);
  },

  async login(email: string, password: string): Promise<User> {
    const response = await apiFetch(API_ENDPOINTS.AUTH_LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (response.status === 401) {
      throw new InvalidCredentialsError();
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const body: unknown = await response.json();
    const user = userFromBody(body);
    if (
      typeof body === 'object' &&
      body !== null &&
      'access_token' in body &&
      typeof body.access_token === 'string'
    ) {
      setAuthToken(body.access_token);
    }
    return user;
  },

  async logout(): Promise<void> {
    try {
      await apiFetch(API_ENDPOINTS.AUTH_LOGOUT, { method: 'POST' });
    } finally {
      setAuthToken(null);
    }
  },
};

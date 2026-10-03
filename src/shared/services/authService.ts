export const AUTH_URL = (process.env.NEXT_PUBLIC_AUTH_URL || '').replace(
  /\/$/,
  '',
);
export interface Session {
  roles?: string[];
  accessLevel?: 'trainee' | 'miembro' | 'representante' | null;
  user: { id: string };
  member: { id: string };
  application: string;
  permissions: string[];
  expiresAt: string;
}
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function authFailure(status: number, code: string) {
  if (
    typeof window !== 'undefined' &&
    (status === 401 ||
      (status === 403 &&
        ['ACCESS_NOT_ENABLED', 'MEMBER_NOT_ACTIVE'].includes(code)))
  )
    window.dispatchEvent(new Event('rafael-session-invalid'));
}
export async function authRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${AUTH_URL}/auth${path}`, {
    ...options,
    credentials: 'include',
    cache: 'no-store',
    signal: options.signal || AbortSignal.timeout(10000),
  });
  const body =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    authFailure(response.status, body?.code || '');
    throw new HttpError(
      response.status,
      body?.code || '',
      body?.message || 'No pudimos comprobar tu sesión.',
    );
  }
  return body as T;
}
export async function csrfHeaders() {
  const result = await authRequest<{ csrfToken: string }>('/csrf');
  return { 'X-CSRF-Token': result.csrfToken };
}

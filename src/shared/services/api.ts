import { csrfHeaders, HttpError, authFailure } from './authService';
import { API_URL } from '@/shared/constants/api';

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!API_URL) throw new Error('Falta configurar la dirección de la API.');
  const timeout = AbortSignal.timeout(15000);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeout])
    : timeout;
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  if (!['GET', 'HEAD'].includes(options.method || 'GET')) {
    const csrf = await csrfHeaders();
    headers.set('X-CSRF-Token', csrf['X-CSRF-Token']);
  }
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal,
      credentials: 'include',
      cache: 'no-store',
      headers,
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new Error(
      'No pudimos conectar con el servicio. Revisa que la API esté disponible e inténtalo de nuevo.',
    );
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const code =
      payload?.code ||
      (typeof payload?.message === 'string' ? payload.message : '');
    authFailure(response.status, code);
    const message =
      response.status === 401
        ? 'Tu sesión terminó. Vuelve a ingresar.'
        : response.status === 403
          ? 'No tienes permiso para realizar esta operación.'
          : typeof payload?.message === 'string'
            ? payload.message
            : 'No fue posible completar la solicitud.';
    throw new HttpError(response.status, code, message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export async function collection<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T[]> {
  const payload = await request<{ data: T[] }>(path, { signal });
  if (!Array.isArray(payload.data))
    throw new Error('El servicio devolvió una respuesta inválida.');
  return payload.data;
}

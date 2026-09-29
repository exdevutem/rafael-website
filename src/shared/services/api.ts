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
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal,
      cache: 'no-store',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new Error(
      'No pudimos conectar con el servicio. Revisa que la API esté disponible e inténtalo de nuevo.',
    );
  }
  if (!response.ok) {
    if (response.status >= 400 && response.status < 500) {
      const payload = await response.json().catch(() => null);
      if (typeof payload?.message === 'string' && payload.message.length <= 500)
        throw new Error(payload.message);
    }
    if (response.status === 409)
      throw new Error(
        'Ya existe un registro con estos datos. Revisa la información.',
      );
    if (response.status === 400)
      throw new Error(
        'El servicio rechazó los datos. Revisa los campos e inténtalo de nuevo.',
      );
    if ([401, 403].includes(response.status))
      throw new Error('No tienes autorización para realizar esta operación.');
    throw new Error(
      `No fue posible completar la solicitud (${response.status}).`,
    );
  }
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

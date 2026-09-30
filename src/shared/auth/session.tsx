'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AUTH_URL,
  authRequest,
  csrfHeaders,
  HttpError,
  type Session,
} from '@/shared/services/authService';
const Context = createContext<{
  session: Session | null;
  can: (permission: string) => boolean;
  logout: () => Promise<void>;
}>({ session: null, can: () => false, logout: async () => {} });
export const useSession = () => useContext(Context);
const routePermissions: Record<string, string[]> = {
  '/miembros': ['members.read'],
  '/proyectos': ['projects.read'],
  '/eventos': ['events.read'],
  '/patrocinadores': ['sponsors.read'],
  '/anuncios': ['announcements.read', 'announcements.read_all'],
  '/configuracion': ['club_roles.read', 'specialties.read'],
};
export function canVisit(path: string, can: (permission: string) => boolean) {
  const permissions = routePermissions[path.replace(/\/$/, '')];
  return !permissions || permissions.some(can);
}
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [pending, setPending] = useState(false);
  const pathname = usePathname();
  const generation = useRef(0);
  const refresh = useCallback(() => {
    const version = ++generation.current;
    return authRequest<Session>('/me')
      .then((current) => {
        if (version !== generation.current) return;
        setSession(current);
        setError('');
      })
      .catch((cause: unknown) => {
        if (version !== generation.current) return;
        setSession(null);
        if (!(cause instanceof HttpError && cause.status === 401))
          setError(
            cause instanceof HttpError && cause.status === 403
              ? 'Tu cuenta no tiene acceso habilitado a Rafael.'
              : 'No pudimos conectar con ExDev ID. Inténtalo de nuevo.',
          );
      })
      .finally(() => {
        setPending(
          new URLSearchParams(window.location.search).get('auth') ===
            'ACCESS_PENDING',
        );
        setLoading(false);
      });
  }, []);
  useEffect(() => {
    void refresh();
    const invalid = () => {
      generation.current++;
      setSession(null);
      setError('Tu sesión terminó o tu acceso cambió. Vuelve a ingresar.');
    };
    const visible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 60000);
    window.addEventListener('rafael-session-invalid', invalid);
    document.addEventListener('visibilitychange', visible);
    return () => {
      clearInterval(timer);
      window.removeEventListener('rafael-session-invalid', invalid);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [refresh]);
  const can = useCallback(
    (permission: string) => session?.permissions.includes(permission) ?? false,
    [session],
  );
  async function logout() {
    generation.current++;
    setSession(null);
    try {
      await authRequest('/logout', {
        method: 'POST',
        headers: await csrfHeaders(),
      });
      generation.current++;
      setSession(null);
      setPending(false);
      setError('');
    } catch {
      setSession(null);
      setError(
        'No pudimos confirmar el cierre en el servidor. Reintenta cerrar la sesión.',
      );
    }
  }
  if (!session)
    return (
      <main className="rf-login">
        <section className="rf-login-card">
          <div className="rf-eyebrow">EXDEV · UTEM</div>
          <h1>Bienvenido a Rafael</h1>
          <p>Tu espacio para participar y gestionar el club.</p>
          {loading ? (
            <p role="status">Comprobando tu sesión…</p>
          ) : (
            <>
              <a
                className="rf-button rf-primary"
                href={`${AUTH_URL}/auth/login`}
              >
                Ingresar con Google UTEM
              </a>
              {pending && (
                <div className="rf-notice">
                  Tu cuenta institucional está verificada. Falta vincularla con
                  tu miembro y habilitar el acceso a Rafael. Cuando esté listo,
                  vuelve a ingresar.
                </div>
              )}
              {error && <p role="alert">{error}</p>}
              <button className="rf-button" onClick={() => void refresh()}>
                Comprobar acceso
              </button>
            </>
          )}
          <small>ExDev ID · Acceso institucional</small>
        </section>
      </main>
    );
  return (
    <Context.Provider value={{ session, can, logout }}>
      {canVisit(pathname, can) ? (
        children
      ) : (
        <main className="rf-login">
          <section className="rf-login-card">
            <h1>Sin permiso para esta sección</h1>
            <p>
              Tu sesión está activa, pero este acceso no está asignado a tu
              cuenta.
            </p>
            <Link className="rf-button" href="/">
              Volver al inicio
            </Link>
          </section>
        </main>
      )}
    </Context.Provider>
  );
}

# Rafael en Cloudflare Pages con sesión IAM

El frontend sigue siendo un export estático de Next.js. Pages compila las Functions de `functions/` en la raíz del repositorio; `public/_routes.json` se copia a `out/` y limita sus invocaciones a `/auth` y `/api`. No colocar `functions/` dentro de `public/` ni de `out/`.

## 1. Configurar el proyecto Pages de staging

En Settings > Variables and Secrets, configurar estas variables de runtime para el ambiente que sirve `dev-rafael.exdev.cl`:

```dotenv
RAFAEL_ORIGIN=https://dev-rafael.exdev.cl
IAM_UPSTREAM=https://dev-api-iam.exdev.cl
API_UPSTREAM=https://dev-api.exdev.cl
```

Configurar también las variables de build:

```dotenv
REACT_APP_API_URL=/api
REACT_APP_AUTH_URL=
```

Eliminar cualquier `NEXT_PUBLIC_API_URL` antiguo que apunte directamente al dominio de la API. En los builds de Pages (`CF_PAGES=1`, variable provista por Cloudflare) `next.config.ts` fuerza `/api` y autenticación en el mismo origen. Fuera de Pages conserva la configuración local existente. Para un build manual que luego se suba, configurar igualmente las variables de build anteriores.

Build command: `npm run build`. Output directory: `out`. Root directory: la carpeta del proyecto que contiene `package.json` y `functions/`. Usar integración Git de Pages, o Wrangler desde esta raíz (`npx wrangler pages deploy out --project-name NOMBRE_REAL_DEL_PROYECTO`). No usar drag-and-drop del dashboard: no compila el directorio Functions. No crear un `_worker.js` paralelo porque reemplazaría este routing.

Las URLs automáticas `*.pages.dev` y los previews no están autorizados por el proxy; verificar con el dominio personalizado. Usar variables del ambiente correcto: el nombre de la rama de Pages no determina si el backend es staging o producción.

## 2. Configurar IAM de staging en la VM

En `/opt/exdev-iam-service/.env`, cambiar únicamente los orígenes correspondientes:

```dotenv
AUTH_ORIGIN=https://dev-rafael.exdev.cl
AUTH_ORIGINS=https://dev-rafael.exdev.cl
```

Si se mantiene `AUTH_FRONTEND_ORIGIN`, dejarlo también en `https://dev-rafael.exdev.cl` para evitar confusión; `AUTH_ORIGINS` tiene prioridad en el código actual.

En el cliente OAuth de Google, registrar como URI de redirección autorizada exactamente:

```text
https://dev-rafael.exdev.cl/auth/callback
```

Después de cambiar el archivo, recrear el contenedor IAM con Docker Compose desde su directorio de despliegue para que cargue las variables (`docker compose up -d --force-recreate exdev-iam-service`). Un simple restart no vuelve a cargar el env_file. Coordinar este cambio con el despliegue de Pages porque los logins anteriores usan otro callback.

El dominio `dev-api-iam.exdev.cl` y el túnel existente permanecen como destino del proxy. No cambiar el túnel para apuntar IAM a Pages, lo que causaría un bucle. La sesión conserva el nombre `__Host-exdev_rafael_session`, Secure, HttpOnly, Path=/ y ningún Domain.

## 3. Revisar API de negocio

En su entorno HTTPS, `IAM_SESSION_COOKIE` debe ser `__Host-exdev_rafael_session`, o estar ausente para usar ese valor por defecto. No usar aquí el nombre local sin `__Host-`.

Mantener `IAM_BASE_URL` apuntando al servicio IAM para las consultas servidor a servidor; NO apuntarlo a `/auth` de Rafael, pues el proxy no publica `/internal/sessions/validate`. Mantener el token de servicio compartido exclusivamente entre los servidores. No introducirlo en Pages ni en variables NEXT_PUBLIC/REACT_APP.

Las rutas administrativas siguen protegidas por IamGuard. El proxy conserva Origin y X-CSRF-Token en las mutaciones; no sustituye permisos ni las comprobaciones CSRF. No habilitar reglas de caché forzadas para `/auth/*` o `/api/*`; las Functions y los fetch upstream usan no-store.

## 4. Publicar y verificar

1. Publicar los cambios de este repositorio mediante el mecanismo habitual de Pages y verificar que el despliegue incluye Functions.
2. Abrir `https://dev-rafael.exdev.cl/auth/login` e iniciar una sesión nueva. La cookie anterior de IAM pertenece a otro host y no se reutiliza.
3. En DevTools verificar `/auth/me` y `/api/projects/admin`: deben responder 200 para un usuario habilitado con permiso; la cookie debe pertenecer a `dev-rafael.exdev.cl`.
4. En una ventana sin sesión, `/api/projects/admin` debe responder 401. `/api/announcements?limit=3` debe responder 200 si la API tiene desplegado el cambio público de anuncios.
5. Verificar logout: POST `/auth/logout` con CSRF elimina la cookie de Rafael y la siguiente consulta administrativa responde 401. Las mutaciones de negocio sin CSRF siguen siendo rechazadas por IAM.

Los tests locales (`node --test cloudflare/proxy.test.mjs`) validan el proxy con upstream simulado. No reemplazan la prueba de OAuth y cookies en el despliegue real.

## Producción

Aplicar el mismo procedimiento en el ambiente Pages de producción: `RAFAEL_ORIGIN=https://rafael.exdev.cl`, `IAM_UPSTREAM=https://api-iam.exdev.cl` y `API_UPSTREAM` con el dominio HTTPS real de la API de negocio de producción. No copiar el destino de staging.

IAM de producción: `AUTH_ORIGIN=https://rafael.exdev.cl` y `AUTH_ORIGINS=https://rafael.exdev.cl`. Callback Google: `https://rafael.exdev.cl/auth/callback`. Bases, tokens de servicio y variables runtime deben corresponder a ese ambiente; las cookies quedan aisladas por host.

Referencias: https://developers.cloudflare.com/pages/functions/get-started/ y https://developers.cloudflare.com/pages/functions/routing/

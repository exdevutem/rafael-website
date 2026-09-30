const authRoutes = new Map([
  ['/auth/login', 'GET'], ['/auth/callback', 'GET'],
  ['/auth/me', 'GET'], ['/auth/csrf', 'GET'],
  ['/auth/logout', 'POST'], ['/auth/logout-all', 'POST'],
]);
const resources = new Set([
  'announcements', 'applications', 'projects', 'members',
  'roles', 'specialties', 'events', 'sponsors', 'periods',
]);
const cookieNames = new Set(['__Host-exdev_rafael_session', '__Host-exdev_rafael_login']);

function failure(status, code) {
  return Response.json({ code }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function origin(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.origin !== value || url.username || url.password)
    throw new Error('Invalid proxy origin');
  return url.origin;
}

export async function proxy(request, env, kind, fetchUpstream = fetch) {
  const incoming = new URL(request.url);
  let site, upstream;
  try {
    site = origin(env.RAFAEL_ORIGIN);
    upstream = origin(kind === 'auth' ? env.IAM_UPSTREAM : env.API_UPSTREAM);
    if (site === upstream) throw new Error('Proxy loop');
  } catch {
    return failure(503, 'PROXY_NOT_CONFIGURED');
  }
  if (incoming.origin !== site) return failure(403, 'PROXY_HOST_DENIED');
  const path = incoming.pathname.replace(/\/$/, '');
  if (kind === 'auth') {
    if (!authRoutes.has(path)) return failure(404, 'PROXY_ROUTE_NOT_FOUND');
    if (request.method !== authRoutes.get(path)) return failure(405, 'PROXY_METHOD_DENIED');
  } else {
    if (!/^\/api\/[a-zA-Z0-9_/-]+$/.test(path) || !resources.has(path.split('/')[2]))
      return failure(404, 'PROXY_ROUTE_NOT_FOUND');
    if (!['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method))
      return failure(405, 'PROXY_METHOD_DENIED');
  }
  if (!['GET', 'HEAD'].includes(request.method) && request.headers.get('Origin') !== site)
    return failure(403, 'PROXY_ORIGIN_DENIED');

  const headers = new Headers();
  for (const name of ['Accept', 'Content-Type', 'Origin', 'X-CSRF-Token', 'If-Match', 'Idempotency-Key']) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  const cookies = (request.headers.get('Cookie') || '').split(';')
    .map((cookie) => cookie.trim())
    .filter((cookie) => cookieNames.has(cookie.split('=')[0]));
  if (cookies.length) headers.set('Cookie', cookies.join('; '));
  const target = new URL(upstream);
  target.pathname = kind === 'auth' ? path : path.slice(4);
  target.search = incoming.search;
  try {
    const response = await fetchUpstream(target.toString(), {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    });
    // Clone headers without folding multiple Set-Cookie values or following OAuth redirects.
    const result = new Response(response.body, response);
    result.headers.set('Cache-Control', 'no-store');
    result.headers.set('CDN-Cache-Control', 'no-store');
    result.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
    for (const name of [...result.headers.keys()]) {
      if (name.startsWith('access-control-')) result.headers.delete(name);
    }
    return result;
  } catch {
    return failure(502, 'PROXY_UPSTREAM_UNAVAILABLE');
  }
}

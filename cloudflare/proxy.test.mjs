import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proxy } from './proxy.mjs';

const env = {
  RAFAEL_ORIGIN: 'https://dev-rafael.exdev.cl',
  IAM_UPSTREAM: 'https://dev-api-iam.exdev.cl',
  API_UPSTREAM: 'https://dev-api.exdev.cl',
};
const req = (path, options) => new Request(`${env.RAFAEL_ORIGIN}${path}`, options);

test('API forwards session, pagination and authorization errors without caching', async () => {
  const response = await proxy(req('/api/projects/admin?limit=3&offset=10', {
    headers: { Cookie: '__Host-exdev_rafael_session=test; analytics=private' },
  }), env, 'api', async (url, init) => {
    assert.equal(url, `${env.API_UPSTREAM}/projects/admin?limit=3&offset=10`);
    assert.equal(init.headers.get('cookie'), '__Host-exdev_rafael_session=test');
    assert.equal(init.redirect, 'manual');
    assert.equal(init.cache, 'no-store');
    return Response.json({ message: 'SESSION_INVALID' }, { status: 401 });
  });
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await response.json()).message, 'SESSION_INVALID');
});

test('OAuth callback preserves query, redirect and separate cookie headers', async () => {
  const headers = new Headers({ Location: `${env.RAFAEL_ORIGIN}/` });
  headers.append('Set-Cookie', '__Host-exdev_rafael_login=; Max-Age=0; Path=/; Secure; HttpOnly');
  headers.append('Set-Cookie', '__Host-exdev_rafael_session=test; Path=/; Secure; HttpOnly; SameSite=Lax');
  const response = await proxy(req('/auth/callback?code=abc&state=xyz'), env, 'auth', async (url) => {
    assert.equal(url, `${env.IAM_UPSTREAM}/auth/callback?code=abc&state=xyz`);
    return new Response(null, { status: 303, headers });
  });
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), `${env.RAFAEL_ORIGIN}/`);
  assert.deepEqual(response.headers.getSetCookie(), headers.getSetCookie());
});

test('mutations preserve payload, Origin, CSRF and concurrency headers', async () => {
  const response = await proxy(req('/api/members/1', {
    method: 'PATCH', body: '{"nombre":"Ian"}', headers: {
      Origin: env.RAFAEL_ORIGIN, 'X-CSRF-Token': 'csrf',
      'Content-Type': 'application/json', 'If-Match': 'v1', 'Idempotency-Key': 'key',
    },
  }), env, 'api', async (url, init) => {
    assert.equal(url, `${env.API_UPSTREAM}/members/1`);
    assert.equal(init.method, 'PATCH');
    assert.equal(await new Response(init.body).text(), '{"nombre":"Ian"}');
    for (const [key, value] of Object.entries({ origin: env.RAFAEL_ORIGIN, 'x-csrf-token': 'csrf', 'if-match': 'v1', 'idempotency-key': 'key' }))
      assert.equal(init.headers.get(key), value);
    return new Response(null, { status: 204 });
  });
  assert.equal(response.status, 204);
});

for (const [path, kind, options, status] of [
  ['/auth/internal/sessions/validate', 'auth', {}, 404],
  ['/api/internal/sessions/validate', 'api', {}, 404],
  ['/api/projects%2f..%2finternal', 'api', {}, 404],
  ['/auth/logout', 'auth', {}, 405],
  ['/api/projects', 'api', { method: 'POST' }, 403],
  ['/auth/logout', 'auth', { method: 'POST', headers: { Origin: 'https://other.exdev.cl' } }, 403],
]) {
  test(`rejects ${options.method || 'GET'} ${path}`, async () => {
    const result = await proxy(req(path, options), env, kind, () => assert.fail('must not call upstream'));
    assert.equal(result.status, status);
  });
}

test('preview hosts and invalid upstream configuration fail closed', async () => {
  const fetch = () => assert.fail('must not call upstream');
  assert.equal((await proxy(new Request('https://preview.pages.dev/auth/me'), env, 'auth', fetch)).status, 403);
  for (const upstream of [undefined, 'http://localhost', env.RAFAEL_ORIGIN, 'https://host/path'])
    assert.equal((await proxy(req('/auth/me'), { ...env, IAM_UPSTREAM: upstream }, 'auth', fetch)).status, 503);
});

test('network errors do not disclose upstream details', async () => {
  const response = await proxy(req('/auth/me'), env, 'auth', () => { throw new Error('private'); });
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { code: 'PROXY_UPSTREAM_UNAVAILABLE' });
});

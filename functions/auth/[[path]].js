import { proxy } from '../../cloudflare/proxy.mjs';

export function onRequest({ request, env }) {
  return proxy(request, env, 'auth');
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

test('initial 401 finishes loading even when invalidation supersedes refresh', async () => {
  const states = [];
  const effects = [];
  const browser = new EventTarget();
  browser.location = { search: '' };
  const previousWindow = global.window;
  const previousDocument = global.document;
  global.window = browser;
  global.document = new EventTarget();
  const { HttpError, authFailure } = load('src/shared/services/authService.ts', {});
  const { SessionProvider } = load('src/shared/auth/session.tsx', {
    react: {
      createContext: () => ({}),
      useContext: () => ({}),
      useRef: () => ({ current: 0 }),
      useCallback: (fn) => fn,
      useState: (initial) => {
        const index = states.push(initial) - 1;
        return [initial, (value) => { states[index] = value; }];
      },
      useEffect: (fn) => effects.push(fn),
    },
    'next/link': { __esModule: true, default: () => null },
    'next/navigation': { usePathname: () => '/' },
    '@/shared/services/authService': {
      AUTH_URL: '', HttpError,
      authRequest: async () => {
        await Promise.resolve();
        authFailure(401, 'SESSION_REQUIRED');
        throw new HttpError(401, 'SESSION_REQUIRED', 'No session');
      },
    },
  });
  const cleanups = [];
  try {
    SessionProvider({ children: null });
    effects.forEach((effect) => cleanups.push(effect()));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(states[0], null);
    assert.equal(states[1], false, 'login must become available after a 401');
    assert.ok(states[2].includes('Vuelve a ingresar'));
  } finally {
    cleanups.forEach((cleanup) => cleanup?.());
    global.window = previousWindow;
    global.document = previousDocument;
  }
});

function load(file, mocks) {
  const filename = path.resolve(file);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const testModule = { exports: {} };
  const realRequire = createRequire(filename);
  const requireMock = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.endsWith('.css')) return {};
    return realRequire(name);
  };
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename })(requireMock, testModule, testModule.exports);
  return testModule.exports;
}

test('disabled resource does not run its loader or expose previous data', () => {
  const effects = [];
  const { useResource } = load('src/shared/hooks/useResource.ts', {
    react: {
      useState: (initial) => [initial, () => {}],
      useCallback: (fn) => fn,
      useEffect: (fn) => effects.push(fn),
    },
  });
  const resource = useResource(() => assert.fail('must not query administrative API'), false);
  effects.forEach((fn) => fn());
  assert.equal(resource.data, null);
  assert.equal(resource.loading, false);
});

const Link = ({ href, children }) => React.createElement('a', { href }, children);
const Panel = ({ children, title }) => React.createElement('section', null, title, children);
const ui = { PageHeader: Panel, ResourceState: () => null, Empty: Panel, Field: Panel };
test('basic member reaches home without enabling administrative loaders or links', () => {
  const privateCalls = [];
  const getProjects = () => {}, getEvents = () => {};
  const canVisit = (href) => ['/', '/perfil/', '/postulaciones/'].includes(href);
  const { default: Home } = load('src/views/home/home.tsx', {
    '@/shared/services/api': { request: () => {} },
    '@/shared/auth/session': { useSession: () => ({ can: () => false }), canVisit },
    'next/link': { __esModule: true, default: Link },
    '@/shared/services/contentService': { getProjects, getEvents },
    '@/shared/hooks/useResource': { useResource: (loader, enabled = true) => {
      if (loader === getProjects || loader === getEvents) privateCalls.push(enabled);
      return { data: null, loading: false, error: null, reload: () => {} };
    } },
    '@/shared/constants/content': { projectStates: {}, dateLabel: () => '' },
    '@/shared/components/ui/ui': ui,
  });
  const html = renderToStaticMarkup(React.createElement(Home));
  assert.ok(html.includes('Bienvenido a Rafael'));
  assert.deepEqual(privateCalls, [false, false]);
  assert.ok(!html.includes('href="/proyectos/"'));
  assert.ok(!html.includes('href="/miembros/"'));
});

test('basic profile does not mount editor or query administrative specialties', () => {
  const { default: Profile } = load('src/views/profile/profile.tsx', {
    '@/shared/auth/session': { useSession: () => ({ can: () => false }) },
    '@/shared/hooks/useResource': { useResource: () => ({ data: { data: { nombre: 'Miembro', carrera: 'Carrera' } }, reload: () => {} }) },
    '@/shared/hooks/useSave': { useSave: () => assert.fail('editor should not mount') },
    '@/shared/services/api': { request: () => {} },
    '@/shared/services/contentService': { getSpecialties: () => assert.fail('must not request specialties') },
    '@/shared/components/ui/ui': ui,
  });
  const html = renderToStaticMarkup(React.createElement(Profile));
  assert.ok(html.includes('Miembro'));
  assert.ok(!html.includes('<form'));
});

test('403 permission or CSRF denial and 503 do not silently log out a valid session', () => {
  const { authFailure } = load('src/shared/services/authService.ts', {});
  let invalidations = 0;
  global.window = { dispatchEvent: () => invalidations++ };
  try {
    authFailure(403, 'PERMISSION_REQUIRED');
    authFailure(403, 'ACCESS_OR_CSRF_DENIED');
    authFailure(503, 'IAM_UNAVAILABLE');
    assert.equal(invalidations, 0);
    authFailure(401, 'SESSION_INVALID');
    assert.equal(invalidations, 1);
  } finally { delete global.window; }
});

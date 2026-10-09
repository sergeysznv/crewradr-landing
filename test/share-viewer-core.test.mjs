// Tests for the encrypted share viewer.
//
// The browser script public/assets/share-viewer-core.js is loaded exactly as
// shipped (createRequire, no bundling or stringifying), and the Pages Function
// functions/share/[[token]].js is imported with a fake context and fetch.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const require = createRequire(import.meta.url);
const core = require(join(root, 'public', 'assets', 'share-viewer-core.js'));
const golden = JSON.parse(readFileSync(join(here, 'fixtures', 'share_golden.json'), 'utf8'));

const subtle = globalThis.crypto.subtle;

function b64url(bytes) {
  return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function keyBytes(keyB64Url) {
  return new Uint8Array(Buffer.from(keyB64Url.replace(/-/g, '+').replace(/_/g, '/'), 'base64'));
}

// Encrypts `plaintext` in the app's format: base64url(nonce(12) || ct || tag(16)).
async function seal(plaintext, keyB64Url = golden.key) {
  const key = await subtle.importKey('raw', keyBytes(keyB64Url), 'AES-GCM', false, ['encrypt']);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext)));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv, 0);
  out.set(ct, iv.length);
  return b64url(out);
}

function payload(overrides = {}) {
  return {
    v: 1, t: golden.token, seq: 42, fix_at: '2026-10-09T12:00:00.000Z',
    lat: 48.8566, lng: 2.3522, speed_ms: 1.5, heading: 180, name: 'Sam', status: 'live',
    ...overrides,
  };
}

async function expectBadPayload(promise) {
  await assert.rejects(promise, (err) => err instanceof Error && err.message === 'bad_payload');
}

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    _map: m,
  };
}

const KEY43 = golden.key;
const KEY44 = golden.key + '=';

describe('decryptSharePayload', () => {
  test('decrypts the Dart golden vector (Dart -> JS interop)', async () => {
    const p = await core.decryptSharePayload(golden.ciphertext, golden.key, golden.token);
    const e = golden.expected;
    assert.equal(p.lat, e.lat);
    assert.equal(p.lng, e.lng);
    assert.equal(p.seq, e.seq);
    assert.equal(p.name, e.name);
    assert.equal(p.fixAt, e.fix_at);
    assert.equal(p.speedMs, e.speed_ms);
    assert.equal(p.heading, e.heading);
    assert.equal(p.status, e.status);
    assert.equal(e.v, 1);
    assert.equal(p.lat, 37.7749);
    assert.equal(p.lng, -122.4194);
    assert.equal(p.seq, 1760000000007);
  });

  test('accepts the padded 44-char key', async () => {
    const p = await core.decryptSharePayload(golden.ciphertext, KEY44, golden.token);
    assert.equal(p.name, 'Sam');
  });

  test('wrong key throws bad_payload', async () => {
    const wrong = b64url(new Uint8Array(32).fill(7));
    await expectBadPayload(core.decryptSharePayload(golden.ciphertext, wrong, golden.token));
  });

  test('wrong token throws bad_payload', async () => {
    await expectBadPayload(core.decryptSharePayload(golden.ciphertext, golden.key, 'zzzzzzzz23456789'));
  });

  test('tampered ciphertext throws bad_payload', async () => {
    const bytes = keyBytes(golden.ciphertext);
    bytes[20] ^= 1;
    await expectBadPayload(core.decryptSharePayload(b64url(bytes), golden.key, golden.token));
  });

  test('garbage / truncated blob throws bad_payload', async () => {
    await expectBadPayload(core.decryptSharePayload('', golden.key, golden.token));
    await expectBadPayload(core.decryptSharePayload('AAAA', golden.key, golden.token));
    await expectBadPayload(core.decryptSharePayload('!!!not base64!!!', golden.key, golden.token));
    await expectBadPayload(core.decryptSharePayload(null, golden.key, golden.token));
  });

  test('invalid key throws bad_payload', async () => {
    await expectBadPayload(core.decryptSharePayload(golden.ciphertext, 'short', golden.token));
    await expectBadPayload(core.decryptSharePayload(golden.ciphertext, null, golden.token));
  });

  test('a crafted valid payload decrypts', async () => {
    const p = await core.decryptSharePayload(await seal(JSON.stringify(payload())), golden.key, golden.token);
    assert.deepEqual(p, {
      lat: 48.8566, lng: 2.3522, seq: 42, fixAt: '2026-10-09T12:00:00.000Z',
      speedMs: 1.5, heading: 180, name: 'Sam', status: 'live',
    });
  });

  test('lat 91 throws bad_payload', async () => {
    await expectBadPayload(core.decryptSharePayload(await seal(JSON.stringify(payload({ lat: 91 }))), golden.key, golden.token));
  });

  test('lng 181 throws bad_payload', async () => {
    await expectBadPayload(core.decryptSharePayload(await seal(JSON.stringify(payload({ lng: 181 }))), golden.key, golden.token));
  });

  test('NaN coordinates throw bad_payload', async () => {
    // JSON has no NaN literal: cover a non-JSON NaN, a "NaN" string, and the
    // null that JSON.stringify(NaN) produces on a live payload.
    const raw = JSON.stringify(payload()).replace('"lat":48.8566', '"lat":NaN');
    assert.ok(raw.includes('"lat":NaN'));
    await expectBadPayload(core.decryptSharePayload(await seal(raw), golden.key, golden.token));
    await expectBadPayload(core.decryptSharePayload(await seal(JSON.stringify(payload({ lat: 'NaN' }))), golden.key, golden.token));
    await expectBadPayload(core.decryptSharePayload(await seal(JSON.stringify(payload({ lat: NaN }))), golden.key, golden.token));
  });

  test('(0, 0) throws bad_payload', async () => {
    await expectBadPayload(core.decryptSharePayload(await seal(JSON.stringify(payload({ lat: 0, lng: 0 }))), golden.key, golden.token));
  });

  test('v = 2 throws bad_payload', async () => {
    await expectBadPayload(core.decryptSharePayload(await seal(JSON.stringify(payload({ v: 2 }))), golden.key, golden.token));
  });

  test('non-integer or missing seq throws bad_payload', async () => {
    await expectBadPayload(core.decryptSharePayload(await seal(JSON.stringify(payload({ seq: 'x' }))), golden.key, golden.token));
    await expectBadPayload(core.decryptSharePayload(await seal(JSON.stringify(payload({ seq: undefined }))), golden.key, golden.token));
  });

  test('a waiting payload with null coordinates decrypts', async () => {
    const blob = await seal(JSON.stringify(payload({ lat: null, lng: null, speed_ms: null, heading: null, status: 'waiting' })));
    const p = await core.decryptSharePayload(blob, golden.key, golden.token);
    assert.equal(p.status, 'waiting');
    assert.equal(p.lat, null);
    assert.equal(p.lng, null);
    assert.equal(p.speedMs, null);
    assert.equal(p.heading, null);
  });

  test('null coordinates on a live payload throw bad_payload', async () => {
    await expectBadPayload(core.decryptSharePayload(await seal(JSON.stringify(payload({ lat: null, lng: null }))), golden.key, golden.token));
    await expectBadPayload(core.decryptSharePayload(await seal(JSON.stringify(payload({ lng: null, status: 'waiting' }))), golden.key, golden.token));
  });

  test('decrypted name is sanitized', async () => {
    const p = await core.decryptSharePayload(await seal(JSON.stringify(payload({ name: 'S\u0000am' + 'y'.repeat(60) }))), golden.key, golden.token);
    assert.ok(!p.name.includes('\u0000'));
    assert.equal(p.name.length, 40);
  });
});

describe('normalizeKey', () => {
  test('accepts the 43-char and 44-char forms of the same key', () => {
    assert.equal(KEY43.length, 43);
    assert.equal(core.normalizeKey(KEY43), KEY43);
    assert.equal(core.normalizeKey(KEY44), KEY43);
  });
  test('rejects 42 chars, illegal characters and non-strings', () => {
    assert.equal(core.normalizeKey(KEY43.slice(0, 42)), null);
    assert.equal(core.normalizeKey(KEY43.slice(0, 42) + '+'), null);
    assert.equal(core.normalizeKey(KEY43.slice(0, 42) + '/'), null);
    assert.equal(core.normalizeKey(KEY43.slice(0, 41) + '.='), null);
    assert.equal(core.normalizeKey(KEY43 + 'A'), null);
    assert.equal(core.normalizeKey(''), null);
    assert.equal(core.normalizeKey(null), null);
    assert.equal(core.normalizeKey(undefined), null);
  });
});

describe('viewerState', () => {
  test('empty hash and no cached key is incomplete', () => {
    assert.equal(core.viewerState('', true, null), 'incomplete');
  });
  test('short key in hash is incomplete', () => {
    assert.equal(core.viewerState('#k=short', true, null), 'incomplete');
  });
  test('valid hash without subtle is unsupported', () => {
    assert.equal(core.viewerState('#k=' + KEY43, false, null), 'unsupported');
  });
  test('valid hash is ready', () => {
    assert.equal(core.viewerState('#k=' + KEY43, true, null), 'ready');
    assert.equal(core.viewerState('#k=' + KEY44, true, null), 'ready');
  });
  test('empty hash with a valid cached key is ready', () => {
    assert.equal(core.viewerState('', true, KEY43), 'ready');
  });
});

describe('resolveKey / forgetKey', () => {
  const token = golden.token;
  test('stores the key from the hash, returns it from storage after refresh, forgetKey clears it', () => {
    const s = fakeStorage();
    assert.equal(core.resolveKey('#k=' + KEY44, s, token), KEY43);
    assert.equal(s.getItem('k_' + token), KEY43);
    // refresh: fragment already stripped from the address bar
    assert.equal(core.resolveKey('', s, token), KEY43);
    core.forgetKey(s, token);
    assert.equal(s.getItem('k_' + token), null);
    assert.equal(core.resolveKey('', s, token), null);
  });
  test('returns null when neither the hash nor storage has a key', () => {
    assert.equal(core.resolveKey('', fakeStorage(), token), null);
    assert.equal(core.resolveKey('#k=short', fakeStorage(), token), null);
  });
  test('keys are per token', () => {
    const s = fakeStorage();
    core.resolveKey('#k=' + KEY43, s, token);
    assert.equal(core.resolveKey('', s, 'otherotherother2'), null);
  });
  test('a throwing storage (private mode) does not break the hash path', () => {
    const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } };
    assert.equal(core.resolveKey('#k=' + KEY43, throwing, token), KEY43);
    assert.equal(core.resolveKey('', throwing, token), null);
    assert.doesNotThrow(() => core.forgetKey(throwing, token));
    assert.equal(core.resolveKey('#k=' + KEY43, null, token), KEY43);
  });
});

describe('isNewer', () => {
  test('only a strictly greater seq is newer', () => {
    assert.equal(core.isNewer(7, 6), false);
    assert.equal(core.isNewer(7, 7), false);
    assert.equal(core.isNewer(7, 8), true);
  });
  test('anything valid is newer than nothing', () => {
    assert.equal(core.isNewer(null, 1), true);
    assert.equal(core.isNewer(undefined, 1760000000007), true);
    assert.equal(core.isNewer(null, NaN), false);
  });
});

describe('isStale', () => {
  const server = '2026-10-09T12:10:00.000Z';
  test('false at 4 minutes, true at 6 minutes (server time)', () => {
    assert.equal(core.isStale('2026-10-09T12:06:00.000Z', server), false);
    assert.equal(core.isStale('2026-10-09T12:04:00.000Z', server), true);
  });
  test('ignores a skewed viewer clock: only server time counts', (t) => {
    // Viewer clock one hour ahead, then one hour behind: results unchanged.
    t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-10-09T13:10:00.000Z') });
    assert.equal(core.isStale('2026-10-09T12:06:00.000Z', server), false);
    assert.equal(core.isStale('2026-10-09T12:04:00.000Z', server), true);
    t.mock.timers.setTime(Date.parse('2026-10-09T11:10:00.000Z'));
    assert.equal(core.isStale('2026-10-09T12:06:00.000Z', server), false);
    assert.equal(core.isStale('2026-10-09T12:04:00.000Z', server), true);
    assert.equal(core.isStale.length, 2);
  });
  test('handles the RPC microsecond server_time format', () => {
    assert.equal(core.isStale('2026-10-09T12:04:00.000Z', '2026-10-09T12:10:00.123456Z'), true);
    assert.equal(core.isStale('2026-10-09T12:06:00.000Z', '2026-10-09T12:10:00.123456Z'), false);
  });
  test('missing or invalid times are not judged stale', () => {
    assert.equal(core.isStale(null, server), false);
    assert.equal(core.isStale('nope', server), false);
    assert.equal(core.isStale('2026-10-09T12:04:00.000Z', null), false);
  });
});

describe('minutesAgo', () => {
  test('whole minutes relative to server time, never negative', () => {
    assert.equal(core.minutesAgo('2026-10-09T12:04:00.000Z', '2026-10-09T12:10:30.000000Z'), 6);
    assert.equal(core.minutesAgo('2026-10-09T12:10:20.000Z', '2026-10-09T12:10:00.000Z'), 0);
    assert.equal(core.minutesAgo(null, '2026-10-09T12:10:00.000Z'), null);
  });
});

describe('sanitizeName', () => {
  test('removes NUL and caps at 40 chars', () => {
    const s = core.sanitizeName('a\u0000b' + 'x'.repeat(100));
    assert.ok(!s.includes('\u0000'));
    assert.equal(s.length, 40);
    assert.ok(s.startsWith('abx'));
  });
  test('removes other control and bidi-override characters', () => {
    assert.equal(core.sanitizeName('A\u0007\u001b\u007f\u0085‮B\n'), 'AB');
  });
  test('markup is returned as plain text (rendered via textContent)', () => {
    const evil = '<img src=x onerror=alert(1)>';
    assert.equal(core.sanitizeName(evil), evil);
  });
  test('non-strings become empty, surrogate pairs are not split', () => {
    assert.equal(core.sanitizeName(null), '');
    assert.equal(core.sanitizeName(42), '');
    const s = core.sanitizeName('x'.repeat(39) + '\u{1F600}');
    assert.equal(s, 'x'.repeat(39));
  });
});

describe('shipped script shape', () => {
  const src = readFileSync(join(root, 'public', 'assets', 'share-viewer-core.js'), 'utf8');
  test('is a classic script exposing window.CrewRadrShare', () => {
    assert.ok(!/^\s*(import|export)\s/m.test(src), 'no ES module syntax');
    assert.ok(src.includes('window.CrewRadrShare'));
    assert.ok(src.includes('module.exports'));
  });
  test('never touches HTML sinks', () => {
    assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(src));
  });
});

// ── Pages Function ────────────────────────────────────────────────────────
const FN_PATH = join(root, 'functions', 'share', '[[token]].js');
const fnSource = readFileSync(FN_PATH, 'utf8');

function encryptedRegion(source) {
  const start = source.indexOf('// BEGIN encrypted viewer');
  const end = source.indexOf('// END encrypted viewer');
  assert.ok(start >= 0 && end > start, 'encrypted viewer markers present');
  return source.slice(start, end);
}

const HTML_SINK = /\.(innerHTML|outerHTML)\s*[+]?=|insertAdjacentHTML|document\.write|\bhtml\s*:\s*['"`]/;

describe('encrypted branch source guard', () => {
  test('the encrypted viewer region renders decrypted data with textContent only', () => {
    const region = encryptedRegion(fnSource);
    // Non-vacuous: the region really is the viewer that decrypts and renders.
    assert.ok(region.includes('decryptSharePayload'));
    assert.ok(region.includes('sanitizeName'));
    assert.ok(region.includes('textContent'));
    assert.ok(!HTML_SINK.test(region), 'no innerHTML-style sinks in the encrypted viewer');
  });
  test('the guard regex catches the sinks it is meant to catch', () => {
    assert.ok(HTML_SINK.test('el.innerHTML = p.name'));
    assert.ok(HTML_SINK.test('el.innerHTML += x'));
    assert.ok(HTML_SINK.test("L.divIcon({ html: '<b>' + name })"));
    assert.ok(!HTML_SINK.test('el.textContent = p.name'));
  });
});

describe('Pages Function', () => {
  const ENV = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon-key' };
  const TOKEN = golden.token;
  const ENC_RPC = {
    status: 'ok', encrypted: true, mode: 'single', share_kind: 'location',
    enc_payload: golden.ciphertext, enc_updated_at: '2026-10-09T12:00:01.000000+00:00',
    enc_seq: 1760000000007, expires_at: '2026-10-09T14:00:00+00:00',
    server_time: '2026-10-09T12:00:05.123456Z',
  };
  const LEGACY_RPC = {
    status: 'ok', mode: 'single',
    locations: [{ user_id: 'u1', latitude: 51.501, longitude: -0.1419, display_name: 'Ann', updated_at: '2026-10-09T12:00:00Z', speed_ms: 3 }],
  };
  let onRequest;
  let realFetch;
  let rpcBody;
  let fetchCalls;

  before(async () => {
    realFetch = globalThis.fetch;
    ({ onRequest } = await import(pathToFileURL(FN_PATH).href));
  });
  after(() => { globalThis.fetch = realFetch; });

  async function call(path, rpc, headers = {}) {
    rpcBody = rpc;
    fetchCalls = [];
    globalThis.fetch = async (url, init) => {
      fetchCalls.push({ url: String(url), init });
      return new Response(JSON.stringify(rpcBody), { status: 200, headers: { 'content-type': 'application/json' } });
    };
    const request = new Request('https://crewradr.app' + path, { headers });
    const res = await onRequest({ request, env: ENV, params: { token: [path.split('/')[2].split('?')[0]] } });
    return { res, body: await res.text() };
  }

  function assertPrivacyHeaders(res) {
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.equal(res.headers.get('referrer-policy'), 'no-referrer');
    assert.equal(res.headers.get('x-robots-tag'), 'noindex');
  }

  test('encrypted share: shell HTML has no location data and a nonce CSP', async () => {
    const { res, body } = await call('/share/' + TOKEN, ENC_RPC);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/html/);
    assertPrivacyHeaders(res);

    // No ciphertext, coordinates, name or payload metadata in the HTML.
    assert.ok(!body.includes(golden.ciphertext));
    assert.ok(!body.includes(golden.ciphertext.slice(0, 24)));
    for (const leak of ['37.7749', '-122.4194', '1760000000007', '"Sam"', '"enc_payload"', 'avatar', '12:00:01', '14:00:00']) {
      assert.ok(!body.includes(leak), 'shell leaks ' + leak);
    }
    // The RPC was asked with the token only (no key anywhere).
    assert.equal(fetchCalls.length, 1);
    assert.deepEqual(JSON.parse(fetchCalls[0].init.body), { p_token: TOKEN });

    // Generic unfurl tags only.
    const metas = body.match(/<meta [^>]*>/g) || [];
    assert.ok(metas.some((m) => m.includes('og:title')));
    for (const m of metas) assert.ok(!/Sam|37\.77|-122\./.test(m), 'meta leaks: ' + m);

    // CSP: per-response nonce on every script, no unsafe-inline for scripts.
    const csp = res.headers.get('content-security-policy');
    assert.ok(csp, 'CSP header present');
    const nonce = /'nonce-([A-Za-z0-9+/=_-]+)'/.exec(csp)[1];
    assert.ok(nonce.length >= 16);
    const scriptDirective = csp.split(';').map((d) => d.trim()).find((d) => d.startsWith('script-src'));
    assert.ok(!scriptDirective.includes('unsafe-inline'));
    assert.match(csp, /object-src 'none'/);
    assert.match(csp, /base-uri 'none'/);
    assert.match(csp, /frame-ancestors 'none'/);
    const scripts = body.match(/<script\b[^>]*>/g) || [];
    assert.ok(scripts.length >= 3);
    for (const s of scripts) assert.ok(s.includes(`nonce="${nonce}"`), 'script without nonce: ' + s);
    assert.ok(scripts.some((s) => s.includes('src="/assets/share-viewer-core.js"')));

    // The inline init script does what the brief requires.
    for (const needle of ['resolveKey(location.hash', 'sessionStorage', 'history.replaceState', 'forgetKey', 'isNewer', 'isStale', 'decryptSharePayload', 'json=1', 'visibilitychange']) {
      assert.ok(body.includes(needle), 'init script missing ' + needle);
    }
    assert.ok(!HTML_SINK.test(body), 'rendered encrypted page has no innerHTML-style sink');

    // Nonce changes per response.
    const again = await call('/share/' + TOKEN, ENC_RPC);
    assert.notEqual(again.res.headers.get('content-security-policy'), csp);
  });

  test('encrypted share: every language renders the new strings', async () => {
    for (const lang of ['en', 'es', 'fr', 'ar', 'zh', 'ru']) {
      const { res, body } = await call('/share/' + TOKEN + '?lang=' + lang, ENC_RPC);
      assert.equal(res.status, 200, lang);
      assert.ok(body.includes(`lang="${lang}"`), lang);
      assert.ok(!body.includes('undefined'), 'missing string in ' + lang);
    }
  });

  test('encrypted share: ?json=1 returns ciphertext only with no-store headers', async () => {
    const { res, body } = await call('/share/' + TOKEN + '?json=1', ENC_RPC);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /application\/json/);
    assertPrivacyHeaders(res);
    const data = JSON.parse(body);
    assert.deepEqual(data, {
      encrypted: true,
      enc_payload: golden.ciphertext,
      enc_updated_at: ENC_RPC.enc_updated_at,
      enc_seq: ENC_RPC.enc_seq,
      expires_at: ENC_RPC.expires_at,
      server_time: ENC_RPC.server_time,
      share_kind: 'location',
    });
    // And the ciphertext from the JSON endpoint decrypts with the link key.
    const p = await core.decryptSharePayload(data.enc_payload, golden.key, TOKEN);
    assert.equal(p.name, 'Sam');
  });

  test('legacy share: unchanged rendering, no new CSP', async () => {
    const { res, body } = await call('/share/' + TOKEN, LEGACY_RPC);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-security-policy'), null);
    assert.ok(body.includes('51.501'));
    assert.ok(body.includes('Ann'));
    assert.ok(!body.includes('share-viewer-core.js'));
    const json = await call('/share/' + TOKEN + '?json=1', LEGACY_RPC);
    const data = JSON.parse(json.body);
    assert.equal(data.mode, 'single');
    assert.equal(data.locations[0].latitude, 51.501);
    assert.equal(data.encrypted, undefined);
  });

  test('expired and not-found keep their status codes', async () => {
    assert.equal((await call('/share/' + TOKEN, { status: 'expired' })).res.status, 410);
    assert.equal((await call('/share/' + TOKEN, { status: 'not_found' })).res.status, 404);
    assert.equal((await call('/share/' + TOKEN + '?json=1', { status: 'expired' })).res.status, 410);
  });
});

// ── Inline init script in a simulated browser ────────────────────────────
// Runs the exact inline script from the rendered shell in a vm sandbox with a
// minimal fake DOM, Leaflet stub, sessionStorage and fetch.
describe('inline init script (simulated browser)', () => {
  const TOKEN = golden.token;
  let inlineScript;

  before(async () => {
    const { onRequest } = await import(pathToFileURL(FN_PATH).href);
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({
      status: 'ok', encrypted: true, mode: 'single', share_kind: 'location', enc_payload: 'x',
      enc_updated_at: null, enc_seq: 1, expires_at: null, server_time: null,
    }));
    try {
      const res = await onRequest({
        request: new Request('https://crewradr.app/share/' + TOKEN),
        env: { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon' },
        params: { token: [TOKEN] },
      });
      const html = await res.text();
      const m = /<script nonce="[^"]+">([\s\S]*?)<\/script>/.exec(html);
      inlineScript = m[1];
    } finally {
      globalThis.fetch = realFetch;
    }
  });

  function el() {
    return { hidden: false, textContent: '', className: '', style: {}, classList: { toggle() {} } };
  }

  // feed: array of {status, body} returned by successive fetches.
  function boot({ hash, storage = fakeStorage(), feed = [], subtle = true, withCore = true }) {
    const els = new Map();
    const timers = [];
    const fetches = [];
    const markers = [];
    const listeners = {};
    const doc = {
      hidden: false,
      getElementById(id) { if (!els.has(id)) els.set(id, el()); return els.get(id); },
      createElement() { return el(); },
      addEventListener(type, fn) { listeners[type] = fn; },
    };
    const loc = { hash, pathname: '/share/' + TOKEN, search: '' };
    const sandbox = {
      document: doc,
      location: loc,
      history: { state: null, replaceState(_s, _t, url) { loc.hash = ''; loc.replaced = url; } },
      sessionStorage: storage,
      localStorage: fakeStorage(),
      isSecureContext: true,
      crypto: subtle ? globalThis.crypto : {},
      CrewRadrShare: withCore ? core : null,
      setTimeout(fn, ms) { timers.push({ fn, ms }); return timers.length; },
      clearTimeout() {},
      matchMedia: () => ({ matches: false }),
      fetch: async (url, init) => {
        fetches.push({ url, init });
        const next = feed.shift() || { status: 500, body: {} };
        return new Response(JSON.stringify(next.body), { status: next.status });
      },
      L: {
        map() { return { setView() { return this; } }; },
        tileLayer() { return { addTo() { return this; } }; },
        divIcon(o) { return o; },
        marker(ll, opts) {
          const mk = { ll, opts, addTo() { return this; }, setLatLng(x) { this.ll = x; }, setIcon(i) { this.opts.icon = i; } };
          markers.push(mk);
          return mk;
        },
      },
    };
    sandbox.window = sandbox;
    vm.runInNewContext(inlineScript, sandbox);
    return { els: (id) => doc.getElementById(id), timers, fetches, markers, loc, storage, listeners };
  }

  async function settle(cond) {
    for (let i = 0; i < 200; i++) {
      if (cond()) return;
      await new Promise((r) => setImmediate(r));
    }
    assert.fail('condition not reached');
  }

  function encBody(blob, seq, serverTime) {
    return { encrypted: true, enc_payload: blob, enc_updated_at: null, enc_seq: seq, expires_at: null, server_time: serverTime, share_kind: 'location' };
  }

  test('no fragment and nothing stored: incomplete panel, no fetch, no map', () => {
    const b = boot({ hash: '' });
    assert.equal(b.els('panel').hidden, false);
    assert.equal(b.els('panel-title').textContent, STRINGS_EN.encIncompleteTitle);
    assert.equal(b.els('map').hidden, true);
    assert.equal(b.fetches.length, 0);
  });

  test('no crypto.subtle: unsupported panel', () => {
    const b = boot({ hash: '#k=' + golden.key, subtle: false });
    assert.equal(b.els('panel-title').textContent, STRINGS_EN.encUnsupportedTitle);
    assert.equal(b.fetches.length, 0);
  });

  test('decrypts, renders with textContent, strips the fragment, keeps the key for refresh', async () => {
    const storage = fakeStorage();
    const b = boot({ hash: '#k=' + golden.key, storage, feed: [{ status: 200, body: encBody(golden.ciphertext, 1760000000007, '2026-10-09T12:03:00.123456Z') }] });
    assert.equal(b.loc.hash, '');
    assert.equal(b.loc.replaced, '/share/' + TOKEN);
    assert.equal(storage.getItem('k_' + TOKEN), golden.key);
    await settle(() => b.timers.length > 0);
    assert.equal(b.fetches[0].url.startsWith('?json=1'), true);
    assert.ok(!b.fetches[0].url.includes(golden.key));
    assert.equal(b.els('who').textContent, 'Sam');
    assert.deepEqual([...b.markers[0].ll], [37.7749, -122.4194]);
    assert.equal(b.markers[0].opts.icon.html.textContent, 'S');
    assert.equal(b.els('meta').textContent.startsWith('Updated 3 min ago'), true);
    assert.equal(b.els('stale').hidden, true);
    assert.equal(b.timers[0].ms, 5000);

    // Refresh: fragment gone, key comes from sessionStorage.
    const again = boot({ hash: '', storage, feed: [{ status: 200, body: encBody(golden.ciphertext, 1760000000007, '2026-10-09T12:06:00Z') }] });
    await settle(() => again.timers.length > 0);
    assert.equal(again.els('who').textContent, 'Sam');
    assert.equal(again.els('stale').hidden, false, 'stale after 6 min of server time');
  });

  test('older or replayed payloads never move the marker back', async () => {
    const newer = await seal(JSON.stringify(payload({ seq: 50, lat: 10, lng: 10, fix_at: '2026-10-09T12:00:00Z' })));
    const older = await seal(JSON.stringify(payload({ seq: 40, lat: 20, lng: 20, fix_at: '2026-10-09T12:00:00Z' })));
    const b = boot({
      hash: '#k=' + golden.key,
      feed: [
        { status: 200, body: encBody(newer, 50, '2026-10-09T12:00:10Z') },
        { status: 200, body: encBody(older, 60, '2026-10-09T12:00:20Z') }, // lying seq hint
      ],
    });
    await settle(() => b.timers.length === 1);
    b.timers[0].fn();
    await settle(() => b.timers.length === 2);
    assert.deepEqual([...b.markers[0].ll], [10, 10]);
  });

  test('wrong key: undecryptable panel', async () => {
    const wrong = b64url(new Uint8Array(32).fill(9));
    const b = boot({ hash: '#k=' + wrong, feed: [{ status: 200, body: encBody(golden.ciphertext, 1, null) }] });
    await settle(() => b.els('panel-title').textContent !== '');
    assert.equal(b.els('panel-title').textContent, STRINGS_EN.encUndecryptableTitle);
    assert.equal(b.markers.length, 0);
  });

  test('a name with markup is shown as text', async () => {
    const evil = '<img src=x onerror=alert(1)>';
    const blob = await seal(JSON.stringify(payload({ name: evil })));
    const b = boot({ hash: '#k=' + golden.key, feed: [{ status: 200, body: encBody(blob, 42, null) }] });
    await settle(() => b.timers.length > 0);
    assert.equal(b.els('who').textContent, evil);
  });

  test('waiting payload: waiting message, no marker', async () => {
    const blob = await seal(JSON.stringify(payload({ lat: null, lng: null, status: 'waiting' })));
    const b = boot({ hash: '#k=' + golden.key, feed: [{ status: 200, body: encBody(blob, 42, null) }] });
    await settle(() => b.timers.length > 0);
    assert.equal(b.els('status').textContent, STRINGS_EN.waitingForLocation);
    assert.equal(b.els('status').hidden, false);
    assert.equal(b.markers.length, 0);
  });

  test('expired: forgets the key and shows the expired panel', async () => {
    const storage = fakeStorage();
    const b = boot({ hash: '#k=' + golden.key, storage, feed: [{ status: 410, body: {} }] });
    await settle(() => b.els('panel-title').textContent !== '');
    assert.equal(b.els('panel-title').textContent, STRINGS_EN.expiredH1);
    assert.equal(storage.getItem('k_' + TOKEN), null);
  });

  test('revoked / not found: forgets the key and shows the revoked panel', async () => {
    const storage = fakeStorage();
    const b = boot({ hash: '#k=' + golden.key, storage, feed: [{ status: 404, body: {} }] });
    await settle(() => b.els('panel-title').textContent !== '');
    assert.equal(b.els('panel-title').textContent, STRINGS_EN.encRevokedTitle);
    assert.equal(storage.getItem('k_' + TOKEN), null);
  });

  test('server errors back off exponentially', async () => {
    const b = boot({ hash: '#k=' + golden.key, feed: [{ status: 502, body: {} }, { status: 502, body: {} }] });
    await settle(() => b.timers.length === 1);
    b.timers[0].fn();
    await settle(() => b.timers.length === 2);
    assert.equal(b.timers[0].ms, 10000);
    assert.equal(b.timers[1].ms, 20000);
    assert.equal(b.els('retry').hidden, false);
  });
});

const STRINGS_EN = {
  encIncompleteTitle: 'This link is incomplete',
  encUnsupportedTitle: 'Browser not supported',
  encUndecryptableTitle: "This link can't be opened",
  encRevokedTitle: 'This link is no longer available',
  expiredH1: '⏰ This link has expired',
  waitingForLocation: 'Waiting for location...',
};

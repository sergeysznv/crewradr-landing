/*
 * CrewRadr encrypted share viewer core.
 *
 * Classic script (no modules, no imports): browsers get window.CrewRadrShare,
 * Node tests get module.exports. Pure logic only, it never touches the DOM.
 *
 * Link: https://crewradr.app/share/<token>#k=<key>. The key is the unpadded
 * base64url of 32 bytes (43 chars, 44 when padded) and lives only in the URL
 * fragment, which browsers never send to a server.
 *
 * Payload: base64url(nonce(12) || ciphertext || tag(16)), AES-256-GCM over
 * {v:1, t, seq, fix_at, lat, lng, speed_ms, heading, name, status}.
 */
(function () {
  'use strict';

  var STALE_AFTER_MS = 5 * 60 * 1000;
  var MAX_NAME = 40;
  var MAX_BLOB = 16000;
  var STORAGE_PREFIX = 'k_';
  var KEY_RE = /^[A-Za-z0-9_-]{43}=?$/;
  var B64URL_RE = /^[A-Za-z0-9_-]+={0,2}$/;
  var STATUSES = { live: true, waiting: true, arrived: true, paused: true };
  // C0, DEL, C1, and Unicode bidi embedding/override/isolate controls.
  var CONTROL_RE = /[\u0000-\u001F\u007F-\u009F‎‏‪-‮⁦-⁩]/g;

  function badPayload() {
    return new Error('bad_payload');
  }

  /** 43-char unpadded key, or null when `raw` is not a 32-byte base64url key. */
  function normalizeKey(raw) {
    if (typeof raw !== 'string' || !KEY_RE.test(raw)) return null;
    return raw.slice(0, 43);
  }

  function keyFromHash(hash) {
    if (typeof hash !== 'string') return { present: false, key: null };
    var h = hash.charAt(0) === '#' ? hash.slice(1) : hash;
    if (!h) return { present: false, key: null };
    var parts = h.split('&');
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].slice(0, 2) === 'k=') {
        return { present: true, key: normalizeKey(parts[i].slice(2)) };
      }
    }
    return { present: false, key: null };
  }

  /** 'unsupported' | 'ready' | 'incomplete'. */
  function viewerState(hash, hasSubtle, cachedKey) {
    if (!hasSubtle) return 'unsupported';
    if (keyFromHash(hash).key || normalizeKey(cachedKey)) return 'ready';
    return 'incomplete';
  }

  /**
   * The key from `#k=` (also remembered in tab-scoped storage under
   * 'k_' + token so a refresh or back/forward keeps working after the
   * fragment is stripped), or the remembered key when the hash has none.
   */
  function resolveKey(hash, storage, token) {
    var fromHash = keyFromHash(hash);
    var slot = STORAGE_PREFIX + token;
    if (fromHash.key) {
      try { if (storage) storage.setItem(slot, fromHash.key); } catch (e) { /* storage disabled */ }
      return fromHash.key;
    }
    if (fromHash.present) return null; // a broken key in the link wins over a stored one
    try {
      return storage ? normalizeKey(storage.getItem(slot)) : null;
    } catch (e) {
      return null;
    }
  }

  function forgetKey(storage, token) {
    try { if (storage) storage.removeItem(STORAGE_PREFIX + token); } catch (e) { /* ignore */ }
  }

  function b64urlToBytes(s) {
    if (typeof s !== 'string' || s.length === 0 || s.length > MAX_BLOB || !B64URL_RE.test(s)) {
      throw badPayload();
    }
    var b64 = s.replace(/=+$/, '').replace(/-/g, '+').replace(/_/g, '/');
    if (b64.length % 4 === 1) throw badPayload();
    while (b64.length % 4) b64 += '=';
    var bin;
    try { bin = atob(b64); } catch (e) { throw badPayload(); }
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function finiteOrNull(v) {
    return typeof v === 'number' && isFinite(v) ? v : null;
  }

  function validCoordinate(lat, lng) {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (!isFinite(lat) || !isFinite(lng)) return false;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
    return !(lat === 0 && lng === 0);
  }

  /**
   * Decrypts and validates one payload. Resolves to
   * {lat, lng, seq, fixAt, speedMs, heading, name, status}; rejects with
   * Error('bad_payload') for anything that is not a valid payload for `token`.
   */
  async function decryptSharePayload(blobB64Url, keyRaw, token) {
    var key = normalizeKey(keyRaw);
    if (!key) throw badPayload();
    var bytes = b64urlToBytes(blobB64Url);
    if (bytes.length < 12 + 16 + 2) throw badPayload();
    var keyBytes = b64urlToBytes(key);
    if (keyBytes.length !== 32) throw badPayload();

    var subtle = globalThis.crypto && globalThis.crypto.subtle;
    if (!subtle) throw badPayload();

    var obj;
    try {
      var cryptoKey = await subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
      var plain = await subtle.decrypt(
        { name: 'AES-GCM', iv: bytes.subarray(0, 12), tagLength: 128 },
        cryptoKey,
        bytes.subarray(12)
      );
      obj = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plain));
    } catch (e) {
      throw badPayload();
    }

    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw badPayload();
    if (obj.v !== 1) throw badPayload();
    if (typeof token !== 'string' || obj.t !== token) throw badPayload();
    if (typeof obj.seq !== 'number' || !Number.isSafeInteger(obj.seq) || obj.seq < 0) throw badPayload();
    if (typeof obj.status !== 'string' || !STATUSES.hasOwnProperty(obj.status)) throw badPayload();
    if (typeof obj.fix_at !== 'string' || parseIso(obj.fix_at) === null) throw badPayload();

    var lat = obj.lat;
    var lng = obj.lng;
    if (lat === null && lng === null && obj.status === 'waiting') {
      // No fix yet: valid only while waiting.
    } else if (!validCoordinate(lat, lng)) {
      throw badPayload();
    }

    return {
      lat: lat,
      lng: lng,
      seq: obj.seq,
      fixAt: obj.fix_at,
      speedMs: finiteOrNull(obj.speed_ms),
      heading: finiteOrNull(obj.heading),
      name: sanitizeName(obj.name),
      status: obj.status
    };
  }

  /** True only when `seq` is strictly greater than the one already shown. */
  function isNewer(prevSeq, seq) {
    if (typeof seq !== 'number' || !isFinite(seq)) return false;
    if (prevSeq === null || prevSeq === undefined) return true;
    return seq > prevSeq;
  }

  /**
   * Milliseconds since the epoch, or null. Postgres sends microseconds
   * (".123456Z"); trim to milliseconds so every engine parses it.
   */
  function parseIso(iso) {
    if (typeof iso !== 'string' || !iso) return null;
    var trimmed = iso.replace(/(\.\d{3})\d+/, '$1');
    var ms = Date.parse(trimmed);
    return isFinite(ms) ? ms : null;
  }

  /** Older than 5 minutes, judged only against the server's clock. */
  function isStale(fixAtIso, serverNowIso) {
    var fix = parseIso(fixAtIso);
    var now = parseIso(serverNowIso);
    if (fix === null || now === null) return false;
    return now - fix > STALE_AFTER_MS;
  }

  /** Whole minutes between the fix and server time (>= 0), or null. */
  function minutesAgo(fixAtIso, serverNowIso) {
    var fix = parseIso(fixAtIso);
    var now = parseIso(serverNowIso);
    if (fix === null || now === null) return null;
    return Math.max(0, Math.floor((now - fix) / 60000));
  }

  /** Plain text for display: control characters removed, at most 40 chars. */
  function sanitizeName(name) {
    if (typeof name !== 'string') return '';
    var s = name.replace(CONTROL_RE, '').trim();
    if (s.length > MAX_NAME) {
      s = s.slice(0, MAX_NAME);
      var last = s.charCodeAt(s.length - 1);
      if (last >= 0xD800 && last <= 0xDBFF) s = s.slice(0, -1); // do not split a surrogate pair
    }
    return s;
  }

  var api = {
    normalizeKey: normalizeKey,
    viewerState: viewerState,
    resolveKey: resolveKey,
    forgetKey: forgetKey,
    decryptSharePayload: decryptSharePayload,
    isNewer: isNewer,
    isStale: isStale,
    minutesAgo: minutesAgo,
    sanitizeName: sanitizeName
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.CrewRadrShare = Object.freeze(api);
})();

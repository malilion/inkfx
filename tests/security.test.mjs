import test from 'node:test';
import assert from 'node:assert/strict';
import { handleGalleryRequest } from '../gallery/serve.mjs';

async function dispatch(method, url) {
  let statusCode = 200;
  const headers = {};
  let body = '';
  const req = { method, url };
  const res = {
    writeHead(code, h = {}) {
      statusCode = code;
      for (const [k, v] of Object.entries(h)) {
        headers[k.toLowerCase()] = v;
      }
      return this;
    },
    end(chunk) {
      if (chunk) body = Buffer.isBuffer(chunk) ? chunk.toString() : String(chunk);
    },
  };
  await handleGalleryRequest(req, res);
  return { statusCode, headers, body };
}

test('gallery server security hardening and traversal defenses', async () => {
  // 1. Path traversal via percent-encoded slashes must return 404
  const traversal1 = await dispatch('GET', '/gallery/..%2fpackage.json');
  assert.equal(traversal1.statusCode, 404, 'Encoded traversal to root package.json must be blocked');

  // 2. Deep traversal must return 404
  const traversal2 = await dispatch('GET', '/gallery/..%2f..%2f..%2fetc%2fpasswd');
  assert.equal(traversal2.statusCode, 404, 'Deep traversal must be blocked');

  // 3. Direct access to forbidden root files must return 404
  const forbidden1 = await dispatch('GET', '/package.json');
  assert.equal(forbidden1.statusCode, 404, 'Root package.json access must be blocked');

  // 4. Non-GET/HEAD methods must return 405 Method Not Allowed
  const postReq = await dispatch('POST', '/gallery/index.html');
  assert.equal(postReq.statusCode, 405, 'POST method must return 405');
  assert.equal(postReq.headers['x-content-type-options'], 'nosniff');

  // 5. Valid static files must return 200 with proper security headers
  const valid = await dispatch('GET', '/gallery/index.html');
  assert.equal(valid.statusCode, 200, 'Valid index.html must return 200');
  assert.equal(valid.headers['x-content-type-options'], 'nosniff');
  assert.equal(valid.headers['x-frame-options'], 'SAMEORIGIN');
  assert.equal(valid.headers['referrer-policy'], 'strict-origin-when-cross-origin');
  assert.ok(valid.headers['permissions-policy']?.includes('camera=()'));
  assert.ok(valid.headers['content-security-policy']?.includes("default-src 'self'"));
  assert.ok(valid.body.includes('<!doctype html>'));

  // 6. HEAD requests must return 200 without body
  const headReq = await dispatch('HEAD', '/gallery/index.html');
  assert.equal(headReq.statusCode, 200, 'HEAD request must return 200');
  assert.equal(headReq.body, '', 'HEAD response body must be empty');

  // 7. Non-whitelisted file extensions must return 404
  const badExt = await dispatch('GET', '/gallery/something.php');
  assert.equal(badExt.statusCode, 404, 'Unknown file extensions must return 404');

  // 8. Security meta tags in HTML
  assert.ok(valid.body.includes('<meta name="referrer" content="strict-origin-when-cross-origin">'), 'index.html must have referrer policy meta');
  assert.ok(valid.body.includes('<meta http-equiv="X-Content-Type-Options" content="nosniff">'), 'index.html must have X-Content-Type-Options meta');
  assert.ok(valid.body.includes('<meta http-equiv="Content-Security-Policy" content="default-src \'self\''), 'index.html must have CSP meta');

  const guide = await dispatch('GET', '/gallery/guide.html');
  assert.equal(guide.statusCode, 200);
  assert.ok(guide.body.includes('<meta name="referrer" content="strict-origin-when-cross-origin">'), 'guide.html must have referrer policy meta');
  assert.ok(guide.body.includes('<meta http-equiv="X-Content-Type-Options" content="nosniff">'), 'guide.html must have X-Content-Type-Options meta');
  assert.ok(guide.body.includes('<meta http-equiv="Content-Security-Policy" content="default-src \'self\''), 'guide.html must have CSP meta');

  // 9. Guide JS is loaded as external module without inline script execution
  assert.ok(guide.body.includes('<script type="module" src="./guide.js"></script>'));
  assert.ok(!guide.body.includes('<script type="module">const langBtns'));

  const guideJs = await dispatch('GET', '/gallery/guide.js');
  assert.equal(guideJs.statusCode, 200);
  assert.equal(guideJs.headers['content-type'], 'text/javascript; charset=utf-8');
  assert.ok(guideJs.body.includes('data-set-lang'));
});

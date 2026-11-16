import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import app from '../src/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Backend Architecture Smoke Test', async (t) => {
  let server;
  let port;

  await t.test('Server starts on dynamic port', async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });
    assert.ok(port > 0, 'Server should have a valid port');
  });

  await t.test('GET /api/health returns 200 and healthy status', async () => {
    const res = await fetch(`http://localhost:${port}/api/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'healthy');
  });

  await t.test('Security headers (Helmet) are present', async () => {
    const res = await fetch(`http://localhost:${port}/api/health`);
    assert.ok(res.headers.get('x-dns-prefetch-control'), 'Helmet headers should be present');
    assert.ok(res.headers.get('x-content-type-options'), 'nosniff header should be present');
  });

  await t.test('GET / serves frontend index.html SPA entrypoint', async () => {
    const res = await fetch(`http://localhost:${port}/`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('content-type')?.includes('text/html'), true);
    const text = await res.text();
    assert.match(text, /TogetherSpace/);
  });

  await t.test('GET /assets/*.css returns 200 and text/css MIME type', async () => {
    const assetsDir = path.resolve(__dirname, '../../frontend/dist/assets');
    const files = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
    const cssFile = files.find((f) => f.endsWith('.css'));

    if (cssFile) {
      const res = await fetch(`http://localhost:${port}/assets/${cssFile}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type')?.includes('text/css'), true);
    }
  });

  await t.test('Unknown route returns 404 with structured JSON', async () => {
    const res = await fetch(`http://localhost:${port}/api/nonexistent-endpoint`);
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /Route not found/);
  });

  // Cleanup
  await t.test('Server closes cleanly', async () => {
    await new Promise((resolve) => server.close(resolve));
  });
});

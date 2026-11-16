import test from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';

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

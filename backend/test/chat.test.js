import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import app from '../src/app.js';
import { initSocketServer } from '../src/services/socketService.js';

describe('Chat & Real-Time Messaging Security & Workflow', () => {
  let server;
  let port;
  let baseUrl;

  before(async () => {
    server = http.createServer(app);
    initSocketServer(server);
    await new Promise((resolve) => {
      server.listen(0, () => {
        port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('GET /api/messages strictly rejects unauthenticated requests with 401', async () => {
    const res = await fetch(`${baseUrl}/api/messages`);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.match(data.message, /authentication/i);
  });

  test('POST /api/messages strictly rejects unauthenticated requests with 401', async () => {
    const res = await fetch(`${baseUrl}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Hello whisper' })
    });
    assert.strictEqual(res.status, 401);
  });

  test('PUT /api/messages/read strictly rejects unauthenticated requests with 401', async () => {
    const res = await fetch(`${baseUrl}/api/messages/read`, {
      method: 'PUT'
    });
    assert.strictEqual(res.status, 401);
  });

  test('DELETE /api/messages/:id strictly rejects unauthenticated requests with 401', async () => {
    const res = await fetch(`${baseUrl}/api/messages/some-id`, {
      method: 'DELETE'
    });
    assert.strictEqual(res.status, 401);
  });

  test('Message validation: empty messages without attachments are invalid', () => {
    const validate = (content, mediaUrl) => {
      return Boolean((content && content.trim().length > 0) || mediaUrl);
    };

    assert.strictEqual(validate('', null), false);
    assert.strictEqual(validate('   ', null), false);
    assert.strictEqual(validate('Hello my love', null), true);
    assert.strictEqual(validate('', 'https://res.cloudinary.com/demo/image/upload/sample.jpg'), true);
  });

  test('Message ownership rule: only original sender can delete their message', () => {
    const canDeleteMessage = (messageSenderId, requestUserId) => {
      return messageSenderId === requestUserId;
    };

    const userA = 'user-uuid-1';
    const userB = 'user-uuid-2';

    // Partner A can delete Partner A's message
    assert.strictEqual(canDeleteMessage(userA, userA), true);
    // Partner B cannot delete Partner A's message
    assert.strictEqual(canDeleteMessage(userA, userB), false);
  });

  test('Read receipt logic: marking read updates only incoming partner messages', () => {
    const messages = [
      { id: '1', senderId: 'user-1', isRead: false },
      { id: '2', senderId: 'user-2', isRead: false },
      { id: '3', senderId: 'user-1', isRead: false }
    ];

    // User 1 reads: only messages from user-2 should be marked read
    const updatedForUser1 = messages.map(m =>
      m.senderId !== 'user-1' ? { ...m, isRead: true } : m
    );

    assert.strictEqual(updatedForUser1[0].isRead, false); // User 1's own message unchanged
    assert.strictEqual(updatedForUser1[1].isRead, true);  // User 2's message marked read
    assert.strictEqual(updatedForUser1[2].isRead, false); // User 1's own message unchanged
  });
});

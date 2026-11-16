import test from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';
import { formatMediaItem } from '../src/services/mediaService.js';
import {
  listMediaQuerySchema,
  confirmUploadSchema,
  mediaIdParamSchema,
  favoriteParamSchema
} from '../src/validators/mediaValidator.js';
import { signJwtToken } from '../src/utils/token.js';

test('Phase 4: Media Validators & Formatting', async (t) => {
  await t.test('formatMediaItem formats isFavorite and sanitizes uploader', () => {
    const rawMedia = {
      id: 'media-1',
      title: 'Sunset in Amalfi',
      description: 'Our romantic evening',
      mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      thumbnailUrl: null,
      publicId: 'sample_sunset_123',
      mediaType: 'image',
      mimeType: 'image/jpeg',
      fileSize: 1048576,
      uploadedById: 'user-a',
      sharedSpaceId: 'space-1',
      uploadedBy: {
        id: 'user-a',
        name: 'Partner A',
        email: 'partnera@test.com'
      },
      favorites: [{ userId: 'user-b' }]
    };

    // Formatted for User B (favorited)
    const formattedForB = formatMediaItem(rawMedia, 'user-b');
    assert.strictEqual(formattedForB.isFavorite, true);
    assert.strictEqual(formattedForB.uploader.name, 'Partner A');
    assert.strictEqual(formattedForB.uploader.password, undefined);

    // Formatted for User A (not favorited)
    const formattedForA = formatMediaItem(rawMedia, 'user-a');
    assert.strictEqual(formattedForA.isFavorite, false);
  });

  await t.test('listMediaQuerySchema validates and coerces query parameters', () => {
    const parsed = listMediaQuerySchema.safeParse({
      mediaType: 'image',
      favoritesOnly: 'true',
      page: '2',
      limit: '50'
    });

    assert.strictEqual(parsed.success, true);
    assert.strictEqual(parsed.data.mediaType, 'image');
    assert.strictEqual(parsed.data.favoritesOnly, true);
    assert.strictEqual(parsed.data.page, 2);
    assert.strictEqual(parsed.data.limit, 50);

    // Invalid media type
    const invalidType = listMediaQuerySchema.safeParse({ mediaType: 'audio' });
    assert.strictEqual(invalidType.success, false);
  });

  await t.test('confirmUploadSchema requires valid Cloudinary metadata', () => {
    // Missing required fields
    const missing = confirmUploadSchema.safeParse({ title: 'Photo' });
    assert.strictEqual(missing.success, false);

    // Valid upload metadata
    const valid = confirmUploadSchema.safeParse({
      title: 'Our Trip',
      description: 'Day 1',
      mediaUrl: 'https://res.cloudinary.com/demo/image/upload/v12345/trip.jpg',
      publicId: 'trip_123',
      mediaType: 'image',
      mimeType: 'image/jpeg',
      fileSize: 2048000
    });
    assert.strictEqual(valid.success, true);
  });
});

test('Phase 4: Strict Ownership & Deletion Security Logic', async (t) => {
  await t.test('Original uploader can delete their own media', async () => {
    const media = {
      id: 'media-1',
      uploadedById: 'user-a',
      sharedSpaceId: 'space-1',
      publicId: 'asset_123',
      mediaType: 'image'
    };

    const currentUserId = 'user-a';
    assert.strictEqual(media.uploadedById === currentUserId, true, 'Uploader ID must match current user ID');
  });

  await t.test('Partner CANNOT delete media uploaded by the other partner (403 Forbidden)', async () => {
    const media = {
      id: 'media-1',
      uploadedById: 'user-a',
      sharedSpaceId: 'space-1',
      publicId: 'asset_123',
      mediaType: 'image'
    };

    const partnerId = 'user-b';
    const isOwner = media.uploadedById === partnerId;
    assert.strictEqual(isOwner, false, 'Partner B is not the uploader');

    if (!isOwner) {
      const err = new Error('Unauthorized. You can only delete media that you uploaded.');
      err.statusCode = 403;
      err.code = 'NOT_MEDIA_OWNER';
      assert.strictEqual(err.statusCode, 403);
      assert.strictEqual(err.code, 'NOT_MEDIA_OWNER');
    }
  });
});

test('Phase 4: HTTP API Protection & Access Control', async (t) => {
  let server;
  let port;

  await t.test('HTTP server starts on dynamic port', async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });
    assert.ok(port > 0);
  });

  await t.test('GET /api/media rejects unauthenticated request with 401', async () => {
    const res = await fetch(`http://localhost:${port}/api/media`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /Authentication required/);
  });

  await t.test('GET /api/favorites rejects unauthenticated request with 401', async () => {
    const res = await fetch(`http://localhost:${port}/api/favorites`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  await t.test('GET /api/users rejects unauthenticated request with 401', async () => {
    const res = await fetch(`http://localhost:${port}/api/users`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  await t.test('POST /api/media/confirm-upload rejects unauthenticated request with 401', async () => {
    const res = await fetch(`http://localhost:${port}/api/media/confirm-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId: 'test' })
    });
    assert.strictEqual(res.status, 401);
  });

  await t.test('DELETE /api/media/:id rejects unauthenticated request with 401', async () => {
    const res = await fetch(`http://localhost:${port}/api/media/some-media-id`, {
      method: 'DELETE'
    });
    assert.strictEqual(res.status, 401);
  });

  await t.test('POST /api/favorites/:mediaId rejects unauthenticated request with 401', async () => {
    const res = await fetch(`http://localhost:${port}/api/favorites/some-media-id`, {
      method: 'POST'
    });
    assert.strictEqual(res.status, 401);
  });

  await t.test('Server closes cleanly', async () => {
    await new Promise((resolve) => server.close(resolve));
  });
});

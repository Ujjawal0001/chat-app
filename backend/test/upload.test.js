import test from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';
import {
  validateFileMetadata,
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES
} from '../src/utils/fileValidation.js';
import { generateSignedUploadParameters } from '../src/services/uploadService.js';
import { config } from '../src/config/env.js';

test('Phase 5: File Validation Logic', async (t) => {
  await t.test('Allowed image MIME types pass validation within size limit', () => {
    ALLOWED_IMAGE_MIME_TYPES.forEach((mime) => {
      const res = validateFileMetadata(mime, 1024 * 1024, `test.${mime.split('/')[1]}`);
      assert.strictEqual(res.isValid, true, `MIME ${mime} should be valid`);
      assert.strictEqual(res.mediaType, 'image');
    });
  });

  await t.test('Allowed video MIME types pass validation within size limit', () => {
    ALLOWED_VIDEO_MIME_TYPES.forEach((mime) => {
      const res = validateFileMetadata(mime, 5 * 1024 * 1024, 'video.mp4');
      assert.strictEqual(res.isValid, true, `MIME ${mime} should be valid`);
      assert.strictEqual(res.mediaType, 'video');
    });
  });

  await t.test('Dangerous or unpermitted file extensions and MIME types are rejected', () => {
    const maliciousFiles = [
      { mime: 'application/x-msdownload', name: 'virus.exe' },
      { mime: 'text/javascript', name: 'exploit.js' },
      { mime: 'application/zip', name: 'archive.zip' },
      { mime: 'application/pdf', name: 'doc.pdf' }
    ];

    maliciousFiles.forEach((file) => {
      const res = validateFileMetadata(file.mime, 1000, file.name);
      assert.strictEqual(res.isValid, false, `File ${file.name} must be rejected`);
      assert.ok(res.error);
    });
  });

  await t.test('Files exceeding configured size limits are rejected', () => {
    // Image > 20MB
    const oversizedImage = validateFileMetadata('image/jpeg', config.mediaLimits.maxImageSize + 1, 'huge.jpg');
    assert.strictEqual(oversizedImage.isValid, false);
    assert.match(oversizedImage.error, /exceeds maximum permitted size/);

    // Video > 100MB
    const oversizedVideo = validateFileMetadata('video/mp4', config.mediaLimits.maxVideoSize + 1, 'huge.mp4');
    assert.strictEqual(oversizedVideo.isValid, false);
    assert.match(oversizedVideo.error, /exceeds maximum permitted size/);
  });
});

test('Phase 5: Cloudinary Server-Side Signature Generation', async (t) => {
  await t.test('generateSignedUploadParameters produces valid parameters and never exposes secret', () => {
    const params = generateSignedUploadParameters({
      userId: 'user-uuid-1',
      sharedSpaceId: 'space-uuid-1',
      mediaType: 'image'
    });

    assert.ok(params.signature, 'Signature must be generated');
    assert.ok(params.timestamp, 'Timestamp must be present');
    assert.ok(params.apiKey, 'API Key must be present');
    assert.ok(params.cloudName, 'Cloud Name must be present');
    assert.strictEqual(params.folder, `${config.cloudinary.folder}/space-uuid-1`);
    assert.match(params.tags, /togetherspace/);
    assert.ok(params.uploadUrl.includes(config.cloudinary.cloudName));

    // STRICT SECURITY VERIFICATION:
    assert.strictEqual(params.apiSecret, undefined, 'API Secret MUST NEVER be exposed in upload parameters');
    assert.strictEqual(params.CLOUDINARY_API_SECRET, undefined);
  });
});

test('Phase 5: HTTP Upload Endpoints Protection', async (t) => {
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

  await t.test('POST /api/media/upload-signature rejects unauthenticated request with 401', async () => {
    const res = await fetch(`http://localhost:${port}/api/media/upload-signature`, {
      method: 'POST'
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  await t.test('POST /api/media/direct-upload rejects unauthenticated request with 401', async () => {
    const res = await fetch(`http://localhost:${port}/api/media/direct-upload`, {
      method: 'POST'
    });
    assert.strictEqual(res.status, 401);
  });

  await t.test('Server closes cleanly', async () => {
    await new Promise((resolve) => server.close(resolve));
  });
});

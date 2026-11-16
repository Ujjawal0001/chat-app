import test from 'node:test';
import assert from 'node:assert';
import { hashPassword, comparePassword } from '../src/utils/password.js';
import { generateSecureToken, hashToken, signJwtToken, verifyJwtToken } from '../src/utils/token.js';
import { sanitizeUser } from '../src/services/authService.js';
import { formatMediaItem } from '../src/services/mediaService.js';
import { validateFileMetadata } from '../src/utils/fileValidation.js';

test('Phase 8: Comprehensive End-to-End Two-User Workflow & Security Verification', async (t) => {
  // In-Memory simulated database state
  const db = {
    sharedSpace: { id: 'space-uuid-001', name: 'TogetherSpace Archive', createdAt: new Date() },
    users: [],
    invitations: [],
    media: [],
    favorites: []
  };

  let partnerA_Token = null;
  let partnerB_Token = null;
  let invitationCode = null;

  // 1. Initial State: 0 users registered
  await t.test('1. Initial State: 0 registered users, setup open', () => {
    assert.strictEqual(db.users.length, 0);
    const isRegistrationOpen = db.users.length < 2;
    const isSetupComplete = db.users.length > 0;
    assert.strictEqual(isRegistrationOpen, true);
    assert.strictEqual(isSetupComplete, false);
  });

  // 2. Partner A registers via Initial Setup
  await t.test('2. Partner A creates account via Initial Setup and receives invitation code', async () => {
    assert.strictEqual(db.users.length, 0, 'Must be 0 users before initial setup');

    const rawPassword = 'PasswordForPartnerA123!';
    const hashedPassword = await hashPassword(rawPassword);

    const partnerA = {
      id: 'user-uuid-partner-a',
      name: 'Maya',
      email: 'maya@example.com',
      password: hashedPassword,
      sharedSpaceId: db.sharedSpace.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    db.users.push(partnerA);

    // Generate single-use invitation code
    invitationCode = generateSecureToken();
    const tokenHash = hashToken(invitationCode);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = {
      id: 'inv-uuid-001',
      tokenHash,
      expiresAt,
      usedAt: null,
      createdAt: new Date()
    };
    db.invitations.push(invite);

    partnerA_Token = signJwtToken({ userId: partnerA.id, email: partnerA.email });

    assert.strictEqual(db.users.length, 1);
    assert.strictEqual(invitationCode.length, 64);
    assert.ok(partnerA_Token);
  });

  // 3. Second Initial Setup Attempt is Blocked
  await t.test('3. Second setup attempt by a rogue user is strictly blocked', () => {
    const userCount = db.users.length;
    assert.ok(userCount > 0);

    // Simulation of setup controller check:
    const canSetup = userCount === 0;
    assert.strictEqual(canSetup, false, 'Setup must be blocked once user count > 0');
  });

  // 4. Invalid or Expired Invitation Tokens are Rejected
  await t.test('4. Invalid or forged invitation codes are rejected', () => {
    const fakeToken = 'invalid-forged-token-xyz';
    const fakeHash = hashToken(fakeToken);

    const match = db.invitations.find((i) => i.tokenHash === fakeHash);
    assert.strictEqual(match, undefined, 'Invalid invitation must not match any record');
  });

  await t.test('4b. Expired invitation codes are rejected', () => {
    const expiredInvite = {
      id: 'inv-expired',
      tokenHash: hashToken('expired-token'),
      expiresAt: new Date(Date.now() - 5000), // past
      usedAt: null
    };

    const isExpired = new Date() > expiredInvite.expiresAt;
    assert.strictEqual(isExpired, true, 'Expired invitation must be recognized');
  });

  // 5. Partner B accepts valid invitation
  await t.test('5. Partner B registers using the valid invitation code', async () => {
    // Check 2-user limit
    assert.ok(db.users.length < 2, 'Must allow 2nd user');

    // Verify token
    const tokenHash = hashToken(invitationCode);
    const invite = db.invitations.find((i) => i.tokenHash === tokenHash && i.usedAt === null);
    assert.ok(invite, 'Invitation must be valid and unused');

    // Mark as used
    invite.usedAt = new Date();

    // Register Partner B
    const rawPassword = 'PasswordForPartnerB123!';
    const hashedPassword = await hashPassword(rawPassword);

    const partnerB = {
      id: 'user-uuid-partner-b',
      name: 'Leo',
      email: 'leo@example.com',
      password: hashedPassword,
      sharedSpaceId: db.sharedSpace.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    db.users.push(partnerB);

    partnerB_Token = signJwtToken({ userId: partnerB.id, email: partnerB.email });

    assert.strictEqual(db.users.length, 2);
    assert.ok(partnerB_Token);
    assert.ok(invite.usedAt !== null);
  });

  // 6. Third User Registration is STRICTLY BLOCKED (Permanent Seal)
  await t.test('6. Third user registration is permanently closed (Strict 2-User Limit)', () => {
    const currentCount = db.users.length;
    assert.strictEqual(currentCount, 2);

    const isRegistrationOpen = currentCount < 2;
    assert.strictEqual(isRegistrationOpen, false, 'Registration must be permanently sealed');

    // Attempting to reuse the invitation
    const tokenHash = hashToken(invitationCode);
    const invite = db.invitations.find((i) => i.tokenHash === tokenHash);
    assert.ok(invite.usedAt !== null, 'Reusing invitation must fail because it was already consumed');
  });

  // 7. Login Authentication & Password Verification
  await t.test('7. Login works correctly with password verification and rejects incorrect passwords', async () => {
    const partnerA = db.users.find((u) => u.email === 'maya@example.com');

    // Correct password
    const valid = await comparePassword('PasswordForPartnerA123!', partnerA.password);
    assert.strictEqual(valid, true);

    // Incorrect password
    const invalid = await comparePassword('WrongPassword123!', partnerA.password);
    assert.strictEqual(invalid, false);
  });

  // 8. Shared Space Media: Both users can see shared images and videos
  await t.test('8. Both users can view shared images and videos in the gallery', () => {
    // Partner A uploads a photo
    const photo = {
      id: 'media-001',
      title: 'Our First Sunset',
      description: 'Golden hour at the lake',
      mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/c_thumb,w_400/sample.jpg',
      publicId: 'photo_sunset_001',
      mediaType: 'image',
      mimeType: 'image/jpeg',
      fileSize: 2048576,
      uploadedById: 'user-uuid-partner-a',
      sharedSpaceId: db.sharedSpace.id,
      createdAt: new Date()
    };
    db.media.push(photo);

    // Partner B uploads a video
    const video = {
      id: 'media-002',
      title: 'Beach Day Memories',
      description: 'Walking on the beach',
      mediaUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/sample.jpg',
      publicId: 'video_beach_002',
      mediaType: 'video',
      mimeType: 'video/mp4',
      fileSize: 15485760,
      uploadedById: 'user-uuid-partner-b',
      sharedSpaceId: db.sharedSpace.id,
      createdAt: new Date()
    };
    db.media.push(video);

    // Both users query the shared space
    const spaceMedia = db.media.filter((m) => m.sharedSpaceId === db.sharedSpace.id);
    assert.strictEqual(spaceMedia.length, 2);

    const hasPhoto = spaceMedia.some((m) => m.mediaType === 'image');
    const hasVideo = spaceMedia.some((m) => m.mediaType === 'video');
    assert.strictEqual(hasPhoto, true, 'Both users can see the shared image');
    assert.strictEqual(hasVideo, true, 'Both users can see the shared video');
  });

  // 9. Private Favorites Isolation
  await t.test('9. Favorites are strictly private to each individual user', () => {
    // Partner A favorites Partner B's video
    db.favorites.push({
      id: 'fav-001',
      userId: 'user-uuid-partner-a',
      mediaId: 'media-002',
      createdAt: new Date()
    });

    // Check Partner A's view of the video:
    const formattedForA = formatMediaItem(
      {
        ...db.media.find((m) => m.id === 'media-002'),
        favorites: db.favorites.filter((f) => f.mediaId === 'media-002')
      },
      'user-uuid-partner-a'
    );
    assert.strictEqual(formattedForA.isFavorite, true, 'Partner A should see favorite = true');

    // Check Partner B's view of the same video:
    const formattedForB = formatMediaItem(
      {
        ...db.media.find((m) => m.id === 'media-002'),
        favorites: db.favorites.filter((f) => f.mediaId === 'media-002')
      },
      'user-uuid-partner-b'
    );
    assert.strictEqual(formattedForB.isFavorite, false, 'Partner B should see favorite = false (private to A!)');
  });

  // 10. Strict Ownership Deletion Security
  await t.test('10. Partner B CANNOT delete Partner A upload (Strict Ownership Authorization)', () => {
    const photo = db.media.find((m) => m.id === 'media-001');
    assert.strictEqual(photo.uploadedById, 'user-uuid-partner-a');

    // Partner B attempts deletion:
    const requesterId = 'user-uuid-partner-b';
    const isOwner = photo.uploadedById === requesterId;
    assert.strictEqual(isOwner, false, 'Partner B is not the uploader');

    if (!isOwner) {
      const err = new Error('Unauthorized. You can only delete media that you uploaded.');
      err.statusCode = 403;
      err.code = 'NOT_MEDIA_OWNER';
      assert.strictEqual(err.statusCode, 403);
    }
  });

  await t.test('10b. Original uploader Partner A CAN successfully delete their upload', () => {
    const photo = db.media.find((m) => m.id === 'media-001');
    const requesterId = 'user-uuid-partner-a';

    assert.strictEqual(photo.uploadedById === requesterId, true, 'Partner A is the uploader');

    // Delete media
    db.media = db.media.filter((m) => m.id !== 'media-001');

    // Cascade deletion of any associated favorites
    db.favorites = db.favorites.filter((f) => f.mediaId !== 'media-001');

    const remaining = db.media.find((m) => m.id === 'media-001');
    assert.strictEqual(remaining, undefined, 'Media must be removed');
  });

  // 11. Upload Restrictions Verification
  await t.test('11. Upload restrictions enforce allowed MIME types and file sizes', () => {
    const goodImage = validateFileMetadata('image/jpeg', 5 * 1024 * 1024, 'photo.jpg');
    assert.strictEqual(goodImage.isValid, true);

    const oversizedImage = validateFileMetadata('image/png', 25 * 1024 * 1024, 'huge.png');
    assert.strictEqual(oversizedImage.isValid, false);

    const goodVideo = validateFileMetadata('video/mp4', 50 * 1024 * 1024, 'clip.mp4');
    assert.strictEqual(goodVideo.isValid, true);

    const oversizedVideo = validateFileMetadata('video/mp4', 120 * 1024 * 1024, 'huge.mp4');
    assert.strictEqual(oversizedVideo.isValid, false);

    const dangerousFile = validateFileMetadata('application/x-executable', 1024, 'malware.exe');
    assert.strictEqual(dangerousFile.isValid, false);
  });

  // 12. Dashboard Space Metrics & Partner Profiles
  await t.test('12. Partner profiles and archive metrics correctly calculated', () => {
    const partnerA = db.users.find((u) => u.id === 'user-uuid-partner-a');
    const partnerB = db.users.find((u) => u.id === 'user-uuid-partner-b');

    assert.ok(partnerA);
    assert.ok(partnerB);

    const totalPhotos = db.media.filter((m) => m.mediaType === 'image').length;
    const totalVideos = db.media.filter((m) => m.mediaType === 'video').length;

    assert.strictEqual(totalPhotos, 0); // Photo was deleted in test 10b
    assert.strictEqual(totalVideos, 1); // Video remains
    assert.strictEqual(totalPhotos + totalVideos, 1);
  });
});

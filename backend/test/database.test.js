import test from 'node:test';
import assert from 'node:assert';
import prisma from '../src/config/db.js';
import {
  getOrCreateSharedSpace,
  getUserCount,
  isRegistrationOpen,
  assertCanRegisterUser
} from '../src/services/spaceService.js';

test('Phase 2: Database Schema & Two-User Constraint Verification', async (t) => {
  await t.test('Prisma Client has all required models configured', () => {
    assert.ok(prisma.sharedSpace, 'sharedSpace model must exist on Prisma Client');
    assert.ok(prisma.user, 'user model must exist on Prisma Client');
    assert.ok(prisma.media, 'media model must exist on Prisma Client');
    assert.ok(prisma.favorite, 'favorite model must exist on Prisma Client');
    assert.ok(prisma.invitation, 'invitation model must exist on Prisma Client');
  });

  await t.test('assertCanRegisterUser allows registration when user count is 0 or 1', async () => {
    // Mock tx with count = 0
    const mockTx0 = {
      $executeRaw: async () => {},
      user: { count: async () => 0 }
    };
    const count0 = await assertCanRegisterUser(mockTx0);
    assert.strictEqual(count0, 0);

    // Mock tx with count = 1
    const mockTx1 = {
      $executeRaw: async () => {},
      user: { count: async () => 1 }
    };
    const count1 = await assertCanRegisterUser(mockTx1);
    assert.strictEqual(count1, 1);
  });

  await t.test('assertCanRegisterUser strictly rejects when user count is 2 (Two-User Limit)', async () => {
    const mockTx2 = {
      $executeRaw: async () => {},
      user: { count: async () => 2 }
    };

    await assert.rejects(
      async () => {
        await assertCanRegisterUser(mockTx2);
      },
      (err) => {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, 'USER_LIMIT_REACHED');
        assert.match(err.message, /Registration is permanently closed/);
        return true;
      }
    );
  });

  await t.test('isRegistrationOpen returns true when count < 2 and false when count >= 2', async () => {
    const mockTxOpen = { user: { count: async () => 1 } };
    assert.strictEqual(await isRegistrationOpen(mockTxOpen), true);

    const mockTxClosed = { user: { count: async () => 2 } };
    assert.strictEqual(await isRegistrationOpen(mockTxClosed), false);
  });

  await t.test('getOrCreateSharedSpace retrieves existing or creates new space', async () => {
    const mockSpace = { id: 'test-space-id', name: 'Our Shared Space' };
    const mockTx = {
      sharedSpace: {
        findFirst: async () => mockSpace,
        create: async () => mockSpace
      }
    };

    const space = await getOrCreateSharedSpace(mockTx);
    assert.strictEqual(space.id, 'test-space-id');
    assert.strictEqual(space.name, 'Our Shared Space');
  });
});

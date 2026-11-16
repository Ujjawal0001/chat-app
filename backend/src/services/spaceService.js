import prisma from '../config/db.js';

const SPACE_ADVISORY_LOCK_ID = 88299102; // Fixed ID for serializing registration transactions

/**
 * Gets or initializes the singleton shared space for the two users.
 */
export const getOrCreateSharedSpace = async (tx = prisma) => {
  let space = await tx.sharedSpace.findFirst();
  if (!space) {
    space = await tx.sharedSpace.create({
      data: {
        name: 'TogetherSpace Archive'
      }
    });
  }
  return space;
};

/**
 * Gets current count of registered users.
 */
export const getUserCount = async (tx = prisma) => {
  return await tx.user.count();
};

/**
 * Checks whether new registrations are permitted.
 */
export const isRegistrationOpen = async (tx = prisma) => {
  const count = await tx.user.count();
  return count < 2;
};

/**
 * Transaction-safe check to enforce maximum 2 registered users.
 * Acquires a PostgreSQL advisory lock when supported to serialize concurrent registration requests.
 * Throws an error if 2 users already exist.
 */
export const assertCanRegisterUser = async (tx) => {
  try {
    // Acquire PostgreSQL advisory transaction lock to serialize concurrent account creations
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${SPACE_ADVISORY_LOCK_ID})`;
  } catch (err) {
    // Advisory lock may not be supported on some mock/non-postgres databases, continue to count check
  }

  const currentCount = await tx.user.count();
  if (currentCount >= 2) {
    const error = new Error('Registration is permanently closed. TogetherSpace strictly allows exactly two registered users.');
    error.statusCode = 403;
    error.code = 'USER_LIMIT_REACHED';
    throw error;
  }

  return currentCount;
};

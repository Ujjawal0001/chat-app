import prisma from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateSecureToken, hashToken, signJwtToken } from '../utils/token.js';
import { getOrCreateSharedSpace, assertCanRegisterUser, getUserCount, isRegistrationOpen } from './spaceService.js';
import { config } from '../config/env.js';

/**
 * Sanitizes a user object to omit sensitive fields like password hash.
 */
export const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

/**
 * Step 1: Secure initial owner setup.
 * Creates the first user account and automatically generates a single-use invitation code.
 */
export const setupOwnerAccount = async ({ name, email, password, setupSecret }) => {
  // Check if initial setup secret is enforced in environment
  if (config.initialSetupSecret && config.initialSetupSecret.trim() !== '') {
    if (!setupSecret || setupSecret !== config.initialSetupSecret) {
      const err = new Error('Invalid initial setup passphrase.');
      err.statusCode = 403;
      throw err;
    }
  }

  return await prisma.$transaction(async (tx) => {
    // Check if initial setup is already completed
    const existingCount = await tx.user.count();
    if (existingCount > 0) {
      const err = new Error('Initial setup is already completed. Please log in or use an invitation code.');
      err.statusCode = 403;
      throw err;
    }

    // Ensure shared space exists
    const sharedSpace = await getOrCreateSharedSpace(tx);

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create the first user (Owner)
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        sharedSpaceId: sharedSpace.id
      }
    });

    // Generate single-use invitation code for the second partner (valid for 7 days)
    const rawInvitationToken = generateSecureToken();
    const tokenHash = hashToken(rawInvitationToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await tx.invitation.create({
      data: {
        tokenHash,
        expiresAt
      }
    });

    // Generate JWT auth session
    const jwtToken = signJwtToken({ userId: user.id, email: user.email });

    return {
      user: sanitizeUser(user),
      invitationCode: rawInvitationToken,
      invitationExpiresAt: expiresAt,
      jwtToken
    };
  });
};

/**
 * Step 4: Accept invitation code and register second partner account.
 * Closes registration permanently after success.
 */
export const acceptInvitation = async ({ token, name, email, password }) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Transaction-level 2-user enforcement
    await assertCanRegisterUser(tx);

    // 2. Validate email uniqueness
    const existingUser = await tx.user.findUnique({ where: { email } });
    if (existingUser) {
      const err = new Error('An account with this email already exists.');
      err.statusCode = 400;
      throw err;
    }

    // 3. Locate valid invitation by token hash
    const tokenHash = hashToken(token);
    const invitation = await tx.invitation.findUnique({
      where: { tokenHash }
    });

    if (!invitation) {
      const err = new Error('Invalid invitation code. Please verify the code and try again.');
      err.statusCode = 400;
      throw err;
    }

    if (invitation.usedAt) {
      const err = new Error('This invitation code has already been used.');
      err.statusCode = 400;
      throw err;
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      const err = new Error('This invitation code has expired. Please ask your partner to generate a new invitation.');
      err.statusCode = 400;
      throw err;
    }

    // 4. Mark invitation as used
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() }
    });

    // 5. Get shared space
    const sharedSpace = await getOrCreateSharedSpace(tx);

    // 6. Create the second user
    const hashedPassword = await hashPassword(password);
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        sharedSpaceId: sharedSpace.id
      }
    });

    // 7. Generate JWT session
    const jwtToken = signJwtToken({ userId: user.id, email: user.email });

    return {
      user: sanitizeUser(user),
      jwtToken
    };
  });
};

/**
 * Login user with email and password.
 */
export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { sharedSpace: true }
  });

  // Protection against account enumeration: generic error message for non-existent email or wrong password
  if (!user) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const jwtToken = signJwtToken({ userId: user.id, email: user.email });

  return {
    user: sanitizeUser(user),
    jwtToken
  };
};

/**
 * Change authenticated user's password.
 */
export const changeUserPassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  const isCurrentValid = await comparePassword(currentPassword, user.password);
  if (!isCurrentValid) {
    const err = new Error('Incorrect current password.');
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  return true;
};

/**
 * Generate a new single-use invitation code (if exactly 1 user exists).
 */
export const generateNewInvitation = async ({ userId, expiresInDays = 7 }) => {
  return await prisma.$transaction(async (tx) => {
    const userCount = await tx.user.count();
    if (userCount >= 2) {
      const err = new Error('Both accounts are already registered. Registration is permanently closed.');
      err.statusCode = 403;
      throw err;
    }

    // Invalidate any previous unused invitations
    await tx.invitation.deleteMany({
      where: { usedAt: null }
    });

    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const invitation = await tx.invitation.create({
      data: {
        tokenHash,
        expiresAt
      }
    });

    return {
      invitationCode: rawToken,
      expiresAt: invitation.expiresAt
    };
  });
};

/**
 * Get current system invitation & registration status.
 */
export const getSystemAuthStatus = async () => {
  try {
    const userCount = await getUserCount();
    const registrationOpen = userCount < 2;
    const isSetupComplete = userCount > 0;

    let activeInvitation = false;
    let invitationExpiresAt = null;

    if (registrationOpen && isSetupComplete) {
      const latestInvite = await prisma.invitation.findFirst({
        where: {
          usedAt: null,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (latestInvite) {
        activeInvitation = true;
        invitationExpiresAt = latestInvite.expiresAt;
      }
    }

    return {
      userCount,
      maxUsers: 2,
      isSetupComplete,
      isRegistrationOpen: registrationOpen,
      hasActiveInvitation: activeInvitation,
      invitationExpiresAt
    };
  } catch (err) {
    // Graceful fallback when database connection is initializing or unpopulated
    return {
      userCount: 0,
      maxUsers: 2,
      isSetupComplete: false,
      isRegistrationOpen: true,
      hasActiveInvitation: false,
      invitationExpiresAt: null,
      dbStatus: 'pending_configuration'
    };
  }
};

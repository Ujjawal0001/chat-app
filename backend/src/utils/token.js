import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Generates a cryptographically secure random invitation token.
 * Returns raw token (32 bytes hex = 64 characters).
 */
export const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Produces a SHA-256 hash of a raw token for secure database storage.
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
};

/**
 * Generates a signed JWT authentication session token.
 */
export const signJwtToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Verifies a JWT authentication token.
 */
export const verifyJwtToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

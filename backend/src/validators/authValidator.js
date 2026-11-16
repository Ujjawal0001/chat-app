import { z } from 'zod';

export const setupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(50, 'Name cannot exceed 50 characters'),
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(100, 'Password cannot exceed 100 characters'),
  setupSecret: z.string().optional()
});

export const acceptInviteSchema = z.object({
  token: z.string().trim().min(10, 'Invitation token is required'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(50, 'Name cannot exceed 50 characters'),
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(100, 'Password cannot exceed 100 characters')
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long').max(100, 'New password cannot exceed 100 characters')
});

export const createInvitationSchema = z.object({
  expiresInDays: z.number().int().min(1).max(30).optional().default(7)
});

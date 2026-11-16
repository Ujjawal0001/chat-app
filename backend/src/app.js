import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { sendSuccess } from './utils/response.js';
import authRoutes from './routes/authRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find frontend dist directory across different deployment root configurations
const possibleDistPaths = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), 'dist')
];
const frontendDistPath = possibleDistPaths.find((p) => fs.existsSync(p));

// Trust reverse proxy (Essential on Render to correctly read client IP, protocol, and host headers)
app.set('trust proxy', 1);

// Security HTTP headers (disable default restrictive CSP so Google Fonts and Vite SPA scripts load smoothly)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration (Applied to /api endpoints)
const normalizeOrigin = (url) => url ? url.trim().replace(/\/+$/, '') : null;
const configuredFrontend = normalizeOrigin(config.frontendUrl);

const allowedOrigins = [
  configuredFrontend,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

const apiCors = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, same-origin fetch)
    if (!origin) return callback(null, true);
    
    const incomingOrigin = normalizeOrigin(origin);
    const isAllowed = allowedOrigins.includes(incomingOrigin) ||
      (incomingOrigin && (
        incomingOrigin.endsWith('.vercel.app') ||
        incomingOrigin.endsWith('.onrender.com') ||
        incomingOrigin.includes('localhost') ||
        incomingOrigin.includes('127.0.0.1')
      ));

    // Pass boolean to callback without throwing a 500 error
    callback(null, Boolean(isAllowed));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});

// Apply CORS to API routes
app.use('/api', apiCors);

// Global Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // max 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api', generalLimiter);

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health Check Endpoint (Essential for Render & production monitoring)
app.get('/api/health', (req, res) => {
  return sendSuccess(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  }, 'TogetherSpace API is running');
});

// Authentication & Invitation Routes
app.use('/api/auth', authRoutes);
app.use('/api/invitations', invitationRoutes);

// Media, Favorites, Space Users, & Chat Messages Routes
app.use('/api/media', mediaRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Serve Frontend static assets and SPA fallback in production if built
if (frontendDistPath) {
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    return res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// 404 Handler for unmatched API routes
app.use(notFoundHandler);

// Central Global Error Handler
app.use(globalErrorHandler);

export default app;

import { execSync } from 'child_process';
import app from './app.js';
import { config } from './config/env.js';

// Auto-run Prisma migrations in production if remote DATABASE_URL is configured
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1')) {
  try {
    console.log('[Server Startup] Applying database migrations to remote PostgreSQL...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('[Server Startup] Database migrations successfully verified.');
  } catch (migErr) {
    console.warn('[Server Startup Warning] Database migration notice:', migErr.message);
  }
}

const server = app.listen(config.port, () => {
  console.log(`[TogetherSpace Server] Running on port ${config.port} in ${config.nodeEnv} mode`);
  console.log(`[TogetherSpace Server] Allowed Frontend Origin: ${config.frontendUrl}`);
});

// Graceful shutdown handling
const handleShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default server;

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../../frontend');
const backendDir = path.resolve(__dirname, '..');

console.log('[Build] Starting full-stack production build on Render...');

// 1. Ensure backend dependencies (including Prisma CLI) are installed
console.log('[Build] Installing backend dependencies in:', backendDir);
execSync('npm install --include=dev', { cwd: backendDir, stdio: 'inherit' });

// 2. Build frontend if it exists
if (fs.existsSync(frontendDir)) {
  console.log('[Build] Building frontend in:', frontendDir);
  execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
  execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
  console.log('[Build] Frontend build complete!');
}

// 3. Generate Prisma Client using local npm script
console.log('[Build] Generating Prisma Client in:', backendDir);
execSync('npm run prisma:generate', { cwd: backendDir, stdio: 'inherit' });

// 4. Safely apply Prisma migrations in production if DATABASE_URL is configured
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1')) {
  console.log('[Build] Production database detected. Applying database migrations...');
  try {
    execSync('npx prisma migrate deploy', { cwd: backendDir, stdio: 'inherit' });
    console.log('[Build] Migrations deployed successfully!');
  } catch (migErr) {
    console.warn('[Build Warning] Migration execution notice:', migErr.message);
  }
}

console.log('[Build] Full-stack build completed successfully!');

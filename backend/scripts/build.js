import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../../frontend');
const backendDir = path.resolve(__dirname, '..');

console.log('[Build] Starting full-stack production build on Render...');

// 1. Build frontend if it exists
if (fs.existsSync(frontendDir)) {
  console.log('[Build] Building frontend in:', frontendDir);
  execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });
  execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
  console.log('[Build] Frontend build complete!');
}

// 2. Generate Prisma Client
console.log('[Build] Generating Prisma Client in:', backendDir);
execSync('npx prisma generate', { cwd: backendDir, stdio: 'inherit' });
console.log('[Build] Full-stack build completed successfully!');

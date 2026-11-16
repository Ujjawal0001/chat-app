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

// 2. Generate Prisma Client using project-pinned local Prisma (avoiding unpinned npx)
console.log('[Build] Generating Prisma Client in:', backendDir);
try {
  execSync('node ./node_modules/prisma/build/index.js generate', { cwd: backendDir, stdio: 'inherit' });
} catch (err) {
  console.log('[Build] Falling back to npm run prisma:generate...');
  execSync('npm run prisma:generate', { cwd: backendDir, stdio: 'inherit' });
}

console.log('[Build] Full-stack build completed successfully!');

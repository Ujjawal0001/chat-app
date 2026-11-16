# TogetherSpace — Private Two-Person Media Sharing Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748.svg)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791.svg)](https://supabase.com)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5.svg)](https://cloudinary.com)
[![Deployment](https://img.shields.io/badge/Deploy-Render-46E3B7.svg)](https://render.com)

**TogetherSpace** is an exclusive, highly secure, private digital sanctuary architected strictly for **two authorized people** to share, archive, and view high-resolution photographs and videos.

This is not a public social network. There are no followers, public profiles, likes from strangers, or open signups. It is an intimate, permanent digital archive designed with an editorial photography aesthetic.

---

## Key Architecture & Security Principles

1. **Strict Two-User Enclosure**:
   - Both backend transactions (`assertCanRegisterUser`) and a native PostgreSQL database trigger (`check_two_user_limit`) ensure that under no circumstances can a 3rd account ever be registered.
2. **Single-Use Cryptographic Invitations**:
   - The first user creates the space through an initial setup process and receives a single-use, 64-character token valid for 7 days.
   - Stored in PostgreSQL as a SHA-256 hash. Once redeemed by the second user, registration is permanently sealed.
3. **HTTP-Only Cookie Session Security**:
   - Authentication tokens are stored exclusively in HTTP-only, `SameSite=None` (or `Lax`), `Secure` cookies. Eliminates XSS token theft vectors.
4. **Cloudinary Server-Signed Direct Uploads**:
   - Upload signatures are signed on the server with restricted folder paths (`togetherspace/${sharedSpaceId}`).
   - API secrets never touch client code.
5. **Strict Media Ownership & Deletion**:
   - Both partners can view and download all shared photos and videos.
   - **Only the original uploader** has the authorization to delete a media item (`403 Forbidden` if attempted by the other partner).
6. **Private Favorites**:
   - Bookmarks are strictly private to each individual partner's session.
7. **Unified Full-Stack Deployment**:
   - One-click build script compiles the React SPA and serves it from the Express backend, running smoothly under a single Render URL with zero CORS issues.

---

## Technology Stack

- **Frontend**: React 18, Vite, React Router DOM v6, Tailwind CSS, Lucide React icons, Axios.
- **Backend**: Node.js, Express.js REST API, Helmet, CORS, Cookie-Parser, Express-Rate-Limit, Zod validation.
- **Database**: PostgreSQL (Supabase), Prisma ORM v5.22 with automated migrations and seed scripts.
- **Media Storage**: Cloudinary v2 SDK, Multer memory storage.
- **Deployment**: Render Web Service (`render.yaml` Blueprint).

---

## Project Structure

```
together-space/
├── render.yaml                    # Render Blueprint configuration
├── PRODUCTION_GUIDE.md           # Production operations & deployment manual
├── DEPLOY_RENDER.md              # Quickstart guide for Render
├── README.md
├── package.json                   # Root monorepo workspace scripts
│
├── frontend/                      # React 18 SPA (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/              # Setup, Invite, and Accept modals
│   │   │   ├── common/            # Button, Input, Modal, Badge
│   │   │   └── media/             # MediaCard, MediaViewer, UploadModal
│   │   ├── context/               # AuthContext & ThemeContext
│   │   ├── layouts/               # AppLayout (Desktop header + Mobile bottom bar)
│   │   ├── pages/                 # Login, Dashboard, Gallery, Favorites, Settings
│   │   ├── services/              # Axios instance configured with withCredentials: true
│   │   ├── utils/                 # Formatters, cn (clsx + tailwind-merge)
│   │   ├── App.jsx                # Protected & guest route declarations
│   │   └── main.jsx
│   ├── tailwind.config.js         # Editorial typography & theme palette
│   ├── vercel.json                # Optional Vercel SPA rewrites
│   └── package.json
│
└── backend/                       # Node Express REST API
    ├── prisma/
    │   ├── migrations/            # Versioned SQL migrations + 2-user limit trigger
    │   ├── schema.prisma          # SharedSpace, User, Media, Favorite, Invitation
    │   └── seed.js                # Initial seed script
    ├── src/
    │   ├── config/                # Environment, Prisma db, Cloudinary SDK
    │   ├── controllers/           # Auth, Invitations, Media, Favorites, Users
    │   ├── middleware/            # Auth, Upload, Validation, Error handlers
    │   ├── routes/                # Express routers
    │   ├── services/              # Auth, Space, Media, Favorites, Uploads
    │   ├── utils/                 # Password hashing, Token crypto, Cookie options
    │   ├── validators/            # Zod validation schemas
    │   ├── app.js                 # Express application entry
    │   └── server.js              # Server listener & graceful shutdown
    ├── test/                      # 80 automated unit & integration tests
    └── package.json
```

---

## Local Development Quickstart

### 1. Prerequisites
- Node.js >= 18
- Cloudinary account credentials
- PostgreSQL database (Local or Supabase)

### 2. Environment Setup
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Installation
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Running the Development Servers
```bash
# In one terminal (Backend on http://localhost:5000)
npm run dev:backend

# In another terminal (Frontend on http://localhost:5173)
npm run dev:frontend
```

### 5. Running Automated Tests
```bash
cd backend
npm test
```
All 80 assertions will run across:
- Cryptography & token utilities
- Input validation (Zod)
- Two-user invitation lifecycle
- HTTP API security & rate limiting
- Prisma schema & database triggers
- Media ownership and deletion security
- File format & size enforcement
- Cloudinary signature generation

---

## Deploy to Production on Render

Follow our complete [PRODUCTION_GUIDE.md](./PRODUCTION_GUIDE.md) for full instructions.

1. Connect your repo in [Render](https://dashboard.render.com).
2. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
3. Add your environment variables (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `CLOUDINARY_*`, etc.).
4. Click **Deploy**!

# TogetherSpace — Private Two-Person Media Sharing Platform

An exclusive, highly secure, private digital space designed strictly for **two authorized people** to share, archive, and view high-resolution photos and videos.

---

## Architecture Overview

```
together-space/
├── frontend/             # React 18, Vite, Tailwind CSS, Lucide React, Axios
│   ├── public/           # Static assets, SVG branding
│   ├── src/
│   │   ├── components/   # Modular UI elements (Modals, Uploaders, Cards)
│   │   ├── context/      # Auth & Theme state providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── layouts/      # App layouts (Protected, Guest)
│   │   ├── pages/        # Dashboard, Gallery, Viewer, Settings, Auth
│   │   ├── services/     # Axios API service configured with HttpOnly credentials
│   │   ├── utils/        # Formatters, helpers
│   │   ├── App.jsx       # Route declarations
│   │   ├── index.css     # Tailwind & typography styling
│   │   └── main.jsx      # React root
│   ├── tailwind.config.js# Custom editorial aesthetic theme
│   └── package.json
│
├── backend/              # Node.js, Express.js REST API
│   ├── prisma/           # Schema, migrations, and seed scripts
│   ├── src/
│   │   ├── config/       # Environment & Cloudinary configurations
│   │   ├── controllers/  # Route controllers (Auth, Invitations, Media, Favorites)
│   │   ├── middleware/   # JWT auth, rate-limiting, error handling
│   │   ├── routes/       # Express route definitions
│   │   ├── services/     # Business logic & Cloudinary signed upload handlers
│   │   ├── utils/        # Standard response & security helpers
│   │   ├── validators/   # Input validation schemas
│   │   ├── app.js        # Express app initialization & security headers
│   │   └── server.js     # Server entrypoint
│   └── package.json
│
├── .gitignore
├── package.json          # Root monorepo workspace scripts
└── README.md
```

---

## Security & Constraints Highlights

1. **Strict Two-User Limit**: Transaction-safe backend enforcement guarantees that under no circumstances can a 3rd user register.
2. **Invitation-Only Access**: No public signups. The first user completes an initial setup and receives a single-use, time-expiring invitation code for the second user.
3. **HTTP-only Cookie Authentication**: JWT session tokens are stored in secure, SameSite HTTP-only cookies, eliminating XSS token theft vectors.
4. **Cloudinary Signed Direct Uploads**: Secure uploads with server signatures so API secrets never touch client code.
5. **Role & Ownership Isolation**: Both users have shared read access to the archive, but only the original uploader can delete an asset.

---

## Quickstart (Development)

### 1. Prerequisites
- Node.js >= 18
- PostgreSQL (Local or Supabase)
- Cloudinary Account (for media uploads)

### 2. Environment Configuration
Copy `.env.example` in `backend/` and `frontend/`:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Installation
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Running the Application
- Backend: `npm run dev:backend` (runs on `http://localhost:5000`)
- Frontend: `npm run dev:frontend` (runs on `http://localhost:5173`)

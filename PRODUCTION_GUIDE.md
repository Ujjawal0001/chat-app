# TogetherSpace — Production Deployment & Operations Guide

This guide covers production deployment for **TogetherSpace** across Render (Compute), Supabase (PostgreSQL), and Cloudinary (Media Storage).

---

## 1. Cloud Database Setup (Supabase PostgreSQL)

1. Sign up or log in at [supabase.com](https://supabase.com).
2. Click **New Project** and enter your project details and a secure database password.
3. Once provisioned, navigate to **Project Settings** &rarr; **Database**:
   - Scroll to the **Connection strings** section.
   - Select **URI** and toggle to **Transaction Pooler** (Port `6543`):
     ```text
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
     This is your `DATABASE_URL`.
   - Toggle to **Direct** connection (Port `5432`):
     ```text
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
     ```
     This is your `DIRECT_URL`.

---

## 2. Media Storage Setup (Cloudinary)

1. Sign up or log in at [cloudinary.com](https://cloudinary.com).
2. On your Cloudinary Dashboard, locate your **Product Environment Credentials**:
   - **Cloud Name** (`CLOUDINARY_CLOUD_NAME`)
   - **API Key** (`CLOUDINARY_API_KEY`)
   - **API Secret** (`CLOUDINARY_API_SECRET`)
3. Under **Settings** &rarr; **Upload**, verify that unsigned uploads are disabled (TogetherSpace strictly uses server-side signed uploads for maximum security).

---

## 3. Render Web Service Deployment

### Option A: 1-Click via Render Blueprint (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com) &rarr; **Blueprints** &rarr; **New Blueprint Instance**.
2. Connect your repository: `https://github.com/Ujjawal0001/chat-app`.
3. Render reads [`render.yaml`](./render.yaml). Fill in your credentials and click **Apply**!

### Option B: Manual Web Service
1. In Render Dashboard, click **New +** &rarr; **Web Service**.
2. Connect `chat-app` repository.
3. Fill in the build settings:
   - **Language / Runtime**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
4. Under **Environment Variables**, add:

| Key | Example Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `10000` | Render standard port |
| `DATABASE_URL` | `postgresql://postgres.xxx:xxx@...:6543/postgres?pgbouncer=true` | Supabase Pooled Connection |
| `DIRECT_URL` | `postgresql://postgres.xxx:xxx@...:5432/postgres` | Supabase Direct Connection |
| `JWT_SECRET` | `min_32_characters_random_secure_key_123456789` | Signs HTTP-only session cookies |
| `INITIAL_SETUP_SECRET` | `your_chosen_admin_passphrase` | Protects owner setup from unauthorized access |
| `CLOUDINARY_CLOUD_NAME` | `your_cloud_name` | Cloudinary storage account |
| `CLOUDINARY_API_KEY` | `your_api_key` | Cloudinary access key |
| `CLOUDINARY_API_SECRET` | `your_api_secret` | Kept strictly private on server |
| `CLOUDINARY_FOLDER` | `togetherspace` | Root folder for media uploads |
| `MAX_IMAGE_FILE_SIZE` | `20971520` | 20 MB image limit |
| `MAX_VIDEO_FILE_SIZE` | `104857600` | 100 MB video limit |

5. Click **Create Web Service**. Render builds the React frontend, generates Prisma, runs migrations, and starts the full-stack server under your single Render URL!

---

## 4. Initial Account Setup & Two-Partner Onboarding

1. **Owner Setup (Step 1)**:
   - Open your deployed URL (`https://your-service.onrender.com`).
   - Click **Initial Setup &mdash; Create Your Space**.
   - Enter your name, email, and master password.
   - If `INITIAL_SETUP_SECRET` was configured, enter the passphrase.
   - Click **Create Space & Generate Invitation**.
2. **Invitation Generation (Step 2 & 3)**:
   - The system immediately displays your partner's unique 64-character invitation code and one-click shareable link.
   - Send the link privately to your partner.
3. **Partner Acceptance (Step 4 & 5)**:
   - Your partner opens the link (`https://your-service.onrender.com/accept-invite?code=...`).
   - The invitation token is pre-filled.
   - Partner enters their name, email, and password.
   - Upon clicking **Accept Invitation & Join Space**, your partner is authenticated and registration is **permanently closed**.
4. **Permanent Registration Seal**:
   - Any third party visiting the application sees: `"Registration closed • Strictly two authorized accounts"`.
   - Both the backend transaction and the PostgreSQL database trigger will reject any further account creation.

---

## 5. Security & Verification Summary

- **Session Security**: JWT stored in HTTP-only, SameSite cookies.
- **Strict Media Ownership**: Both partners view all shared photos and videos, but only the original uploader can delete an item.
- **Private Favorites**: Bookmarks are isolated per user; Partner A's favorites are invisible to Partner B.
- **Zero Cloudinary Secret Leakage**: The browser performs direct signed uploads using server-signed hashes; API secrets never leave the server.
- **Brute Force Protection**: Express rate limiting on `/api/*` and uniform login rejection messages prevent account enumeration.

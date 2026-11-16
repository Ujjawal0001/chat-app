-- =========================================================================
-- TogetherSpace Initial Migration
-- PostgreSQL Schema with Constraints, Foreign Keys, Indexes, and
-- Database-Level 2-User Limit Enforcement Trigger
-- =========================================================================

-- CreateTable: SharedSpace (Singleton space shared by the two users)
CREATE TABLE IF NOT EXISTS "shared_spaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Our Shared Space',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Users
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "sharedSpaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Media
CREATE TABLE IF NOT EXISTS "media" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "mediaUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "publicId" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "sharedSpaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Favorites (Private favorites per user)
CREATE TABLE IF NOT EXISTS "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Invitations
CREATE TABLE IF NOT EXISTS "invitations" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- Unique & Lookup Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_sharedSpaceId_idx" ON "users"("sharedSpaceId");

CREATE UNIQUE INDEX IF NOT EXISTS "media_publicId_key" ON "media"("publicId");
CREATE INDEX IF NOT EXISTS "media_uploadedById_idx" ON "media"("uploadedById");
CREATE INDEX IF NOT EXISTS "media_sharedSpaceId_idx" ON "media"("sharedSpaceId");
CREATE INDEX IF NOT EXISTS "media_createdAt_idx" ON "media"("createdAt");

CREATE INDEX IF NOT EXISTS "favorites_userId_idx" ON "favorites"("userId");
CREATE INDEX IF NOT EXISTS "favorites_mediaId_idx" ON "favorites"("mediaId");
CREATE UNIQUE INDEX IF NOT EXISTS "favorites_userId_mediaId_key" ON "favorites"("userId", "mediaId");

CREATE UNIQUE INDEX IF NOT EXISTS "invitations_tokenHash_key" ON "invitations"("tokenHash");

-- Foreign Keys with Cascade Deletion
ALTER TABLE "users" 
    DROP CONSTRAINT IF EXISTS "users_sharedSpaceId_fkey",
    ADD CONSTRAINT "users_sharedSpaceId_fkey" 
    FOREIGN KEY ("sharedSpaceId") REFERENCES "shared_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "media" 
    DROP CONSTRAINT IF EXISTS "media_uploadedById_fkey",
    ADD CONSTRAINT "media_uploadedById_fkey" 
    FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "media" 
    DROP CONSTRAINT IF EXISTS "media_sharedSpaceId_fkey",
    ADD CONSTRAINT "media_sharedSpaceId_fkey" 
    FOREIGN KEY ("sharedSpaceId") REFERENCES "shared_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "favorites" 
    DROP CONSTRAINT IF EXISTS "favorites_userId_fkey",
    ADD CONSTRAINT "favorites_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "favorites" 
    DROP CONSTRAINT IF EXISTS "favorites_mediaId_fkey",
    ADD CONSTRAINT "favorites_mediaId_fkey" 
    FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =========================================================================
-- DATABASE-LEVEL ENFORCEMENT: Strict Two-User Limit
-- Guarantees that no 3rd user can EVER be inserted into the "users" table,
-- even via concurrent requests or raw database queries.
-- =========================================================================
CREATE OR REPLACE FUNCTION enforce_two_user_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM "users") >= 2 THEN
        RAISE EXCEPTION 'Registration is permanently closed. TogetherSpace strictly allows exactly two registered users.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_two_user_limit ON "users";
CREATE TRIGGER check_two_user_limit
BEFORE INSERT ON "users"
FOR EACH ROW
EXECUTE FUNCTION enforce_two_user_limit();

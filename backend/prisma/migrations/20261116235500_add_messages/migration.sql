-- CreateTable: Messages (Private real-time 1-on-1 chat for TogetherSpace)
CREATE TABLE IF NOT EXISTS "messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "senderId" TEXT NOT NULL,
    "sharedSpaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messages_sharedSpaceId_idx" ON "messages"("sharedSpaceId");
CREATE INDEX IF NOT EXISTS "messages_senderId_idx" ON "messages"("senderId");
CREATE INDEX IF NOT EXISTS "messages_createdAt_idx" ON "messages"("createdAt");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'messages_senderId_fkey'
    ) THEN
        ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'messages_sharedSpaceId_fkey'
    ) THEN
        ALTER TABLE "messages" ADD CONSTRAINT "messages_sharedSpaceId_fkey" FOREIGN KEY ("sharedSpaceId") REFERENCES "shared_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

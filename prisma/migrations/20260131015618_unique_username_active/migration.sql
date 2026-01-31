-- DropIndex
DROP INDEX "User_username_key";

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

CREATE UNIQUE INDEX unique_username_active
ON "User"(username)
WHERE "deletedAt" IS NULL;

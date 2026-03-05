CREATE UNIQUE INDEX unique_active_title
ON "courses" ("title", "userId")
WHERE "deletedAt" IS NULL;
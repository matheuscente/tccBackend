CREATE UNIQUE INDEX unique_active_username
ON "users" ("username")
WHERE "deletedAt" IS NULL;
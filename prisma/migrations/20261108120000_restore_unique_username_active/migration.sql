-- Restores the partial unique index on users.username, lost when the users table was
-- recreated in 20260222162325_create_course. Usernames stay unique among active users only.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "users" WHERE "deletedAt" IS NULL GROUP BY "username" HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Existem nomes de usuário repetidos entre usuários ativos. Corrija os registros antes de aplicar esta migração.';
  END IF;
END $$;

CREATE UNIQUE INDEX "unique_username_active" ON "users"("username") WHERE "deletedAt" IS NULL;

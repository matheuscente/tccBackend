-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('DOUBT', 'PROBLEM', 'SUGGESTION');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'ANSWERED', 'CLOSED');

-- AlterTable: e-mail do usuário (usuários antigos recebem um e-mail provisório)
ALTER TABLE "users" ADD COLUMN "email" TEXT;
UPDATE "users" SET "email" = "username" || '@pendente.local' WHERE "email" IS NULL;
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- e-mail único somente entre usuários ativos (mesmo padrão do username)
CREATE UNIQUE INDEX unique_email_active ON "users"("email") WHERE "deletedAt" IS NULL;

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "explanation" TEXT,
    "courseId" TEXT,
    "moduleId" TEXT,
    "disciplineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "courseId" TEXT,
    "moduleId" TEXT,
    "disciplineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_questions" (
    "activityId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "activity_questions_pkey" PRIMARY KEY ("activityId","questionId")
);

-- CreateTable
CREATE TABLE "activity_attempts" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_answers" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "attempt_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "courseId" TEXT,
    "moduleId" TEXT,
    "disciplineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "courseId" TEXT,
    "moduleId" TEXT,
    "disciplineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_attachments" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");
CREATE INDEX "questions_userId_idx" ON "questions"("userId");
CREATE INDEX "questions_courseId_idx" ON "questions"("courseId");
CREATE INDEX "questions_moduleId_idx" ON "questions"("moduleId");
CREATE INDEX "questions_disciplineId_idx" ON "questions"("disciplineId");
CREATE INDEX "question_options_questionId_idx" ON "question_options"("questionId");
CREATE INDEX "activities_userId_idx" ON "activities"("userId");
CREATE INDEX "activity_attempts_activityId_idx" ON "activity_attempts"("activityId");
CREATE INDEX "activity_attempts_userId_idx" ON "activity_attempts"("userId");
CREATE INDEX "attempt_answers_attemptId_idx" ON "attempt_answers"("attemptId");
CREATE INDEX "notes_userId_idx" ON "notes"("userId");
CREATE UNIQUE INDEX "files_storageKey_key" ON "files"("storageKey");
CREATE INDEX "files_userId_idx" ON "files"("userId");
CREATE INDEX "tickets_userId_idx" ON "tickets"("userId");
CREATE INDEX "tickets_status_idx" ON "tickets"("status");
CREATE INDEX "ticket_messages_ticketId_idx" ON "ticket_messages"("ticketId");
CREATE UNIQUE INDEX "ticket_attachments_storageKey_key" ON "ticket_attachments"("storageKey");
CREATE INDEX "ticket_attachments_messageId_idx" ON "ticket_attachments"("messageId");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "disciplines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activities" ADD CONSTRAINT "activities_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activities" ADD CONSTRAINT "activities_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activities" ADD CONSTRAINT "activities_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "disciplines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_questions" ADD CONSTRAINT "activity_questions_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_questions" ADD CONSTRAINT "activity_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_attempts" ADD CONSTRAINT "activity_attempts_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_attempts" ADD CONSTRAINT "activity_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "activity_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notes" ADD CONSTRAINT "notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notes" ADD CONSTRAINT "notes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notes" ADD CONSTRAINT "notes_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notes" ADD CONSTRAINT "notes_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "disciplines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "files" ADD CONSTRAINT "files_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "files" ADD CONSTRAINT "files_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "files" ADD CONSTRAINT "files_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "files" ADD CONSTRAINT "files_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "disciplines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ticket_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

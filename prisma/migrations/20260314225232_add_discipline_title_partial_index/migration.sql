CREATE UNIQUE INDEX "disciplines_moduleId_title_unique" 
ON "disciplines"("moduleId", "title") 
WHERE "deletedAt" IS NULL;
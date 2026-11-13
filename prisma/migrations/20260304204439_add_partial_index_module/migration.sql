-- This is an empty migration.

CREATE UNIQUE INDEX unique_module_title_per_course_active
ON "modules" ("title", "courseId")
WHERE "deletedAt" IS NULL;
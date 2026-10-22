import type { StoredFile } from "@prisma/client";
import type { UploadedFileDTO } from "../../modules/files/DTOs/uploaded-file.DTO";
import { randomUUID } from "node:crypto";

export const makeFile = (overrides?: Partial<StoredFile>): StoredFile => {
  const userId = overrides?.userId ?? randomUUID();

  return {
    id: randomUUID(),
    userId,
    originalName: "file.pdf",
    mimeType: "application/pdf",
    size: 1024,
    storageKey: `users/${userId}/${randomUUID()}.pdf`,
    courseId: null,
    moduleId: null,
    disciplineId: null,
    createdAt: new Date(),
    ...overrides
  };
};

export const makeUploadedFile = (overrides?: Partial<UploadedFileDTO>): UploadedFileDTO => ({
  originalname: "file.pdf",
  mimetype: "application/pdf",
  size: 1024,
  buffer: Buffer.from("content"),
  ...overrides
});

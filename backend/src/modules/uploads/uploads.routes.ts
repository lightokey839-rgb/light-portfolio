import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { FastifyInstance } from "fastify";
import { sendError } from "../../middleware/errorHandler.js";
import { UPLOADS_DIR } from "../../utils/paths.js";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export default async function uploadRoutes(fastify: FastifyInstance) {
  await mkdir(UPLOADS_DIR, { recursive: true });

  // POST /api/v1/uploads/image
  fastify.post("/uploads/image", { preHandler: fastify.authenticate }, async (request, reply) => {
    const file = await request.file({ limits: { fileSize: MAX_FILE_SIZE_BYTES } });

    if (!file) {
      return sendError(reply, 400, "NO_FILE", "No file was uploaded.");
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return sendError(
        reply,
        400,
        "UNSUPPORTED_FILE_TYPE",
        "Only JPG, PNG, and WEBP images are allowed."
      );
    }

    // The filename is entirely server-generated — the client's original
    // filename is never used for anything, which rules out path
    // traversal and arbitrary-extension tricks by construction.
    const filename = `${randomUUID()}${EXTENSION_BY_MIME[file.mimetype]}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    try {
      await pipeline(file.file, createWriteStream(filepath));
    } catch {
      return sendError(reply, 500, "UPLOAD_FAILED", "Failed to save the uploaded file.");
    }

    // @fastify/multipart doesn't throw when a file exceeds the size
    // limit — it truncates the stream and sets this flag instead, so it
    // must be checked explicitly after the write completes.
    if (file.file.truncated) {
      await unlink(filepath).catch(() => undefined);
      return sendError(reply, 413, "FILE_TOO_LARGE", "Image must be 5MB or smaller.");
    }

    return reply.status(201).send({ url: `/uploads/${filename}` });
  });
}

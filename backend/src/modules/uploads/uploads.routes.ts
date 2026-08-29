import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { sendError } from "../../middleware/errorHandler.js";
import { supabaseStorage, STORAGE_BUCKET } from "../../plugins/supabaseStorage.js";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export default async function uploadRoutes(fastify: FastifyInstance) {
  // POST /api/v1/uploads/image
  fastify.post("/uploads/image", { preHandler: fastify.authenticate }, async (request, reply) => {
    const file = await request.file({ limits: { fileSize: MAX_FILE_SIZE_BYTES } });

    if (!file) {
      return sendError(reply, 400, "NO_FILE", "No file was uploaded.");
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return sendError(reply, 400, "UNSUPPORTED_FILE_TYPE", "Only JPG, PNG, and WEBP images are allowed.");
    }

    // Server-generated filename only — the client's original filename is
    // never used, which rules out path traversal and extension tricks.
    const filename = `${randomUUID()}${EXTENSION_BY_MIME[file.mimetype]}`;
    const buffer = await file.toBuffer();

    // @fastify/multipart doesn't throw when a file exceeds the size
    // limit — it truncates and sets this flag instead.
    if (file.file.truncated) {
      return sendError(reply, 413, "FILE_TOO_LARGE", "Image must be 5MB or smaller.");
    }

    const { error } = await supabaseStorage.storage
      .from(STORAGE_BUCKET)
      .upload(filename, buffer, { contentType: file.mimetype, upsert: false });

    if (error) {
      request.log.error(error, "Failed to upload image to Supabase Storage");
      return sendError(reply, 500, "UPLOAD_FAILED", "Failed to save the uploaded file.");
    }

    const { data } = supabaseStorage.storage.from(STORAGE_BUCKET).getPublicUrl(filename);

    return reply.status(201).send({ url: data.publicUrl });
  });
}
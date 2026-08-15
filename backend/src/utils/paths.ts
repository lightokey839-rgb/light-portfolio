import path from "node:path";

/** Absolute path to the local uploads directory (backend/uploads). */
export const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

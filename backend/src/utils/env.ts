import "dotenv/config";
import { z } from "zod";

/**
 * All backend configuration comes from environment variables — nothing
 * secret is ever hardcoded. This module validates them once at startup
 * and fails fast (with a readable error) instead of letting a missing
 * var surface later as a confusing runtime crash.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters — generate one with `openssl rand -hex 32`"),

  // How long an admin session stays valid before requiring a fresh login.
  // Accepts any value the `ms` package understands, e.g. "7d", "12h", "30m".
  JWT_EXPIRES_IN: z.string().min(1).default("7d"),

  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL must be a valid email address"),
  ADMIN_PASSWORD: z
    .string()
    .min(10, "ADMIN_PASSWORD must be at least 10 characters"),

  FRONTEND_URL: z
    .string()
    .url("FRONTEND_URL must be a valid URL, e.g. http://localhost:5173"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("\n❌ Invalid or missing environment variables:\n");
    for (const issue of parsed.error.issues) {
      // eslint-disable-next-line no-console
      console.error(`  • ${issue.path.join(".")}: ${issue.message}`);
    }
    // eslint-disable-next-line no-console
    console.error(
      "\nCopy backend/.env.example to backend/.env and fill in real values, then try again.\n"
    );
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();
export const isProduction = env.NODE_ENV === "production";

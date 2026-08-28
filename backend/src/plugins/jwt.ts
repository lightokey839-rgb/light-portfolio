import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import { env, isProduction } from "../utils/env.js";
import { sendError } from "../middleware/errorHandler.js";

/** Name of the httpOnly cookie that carries the admin session token. */
export const SESSION_COOKIE_NAME = "admin_session";

/** Shape of the data we embed in the signed JWT. */
export interface AdminTokenPayload {
  adminId: string;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AdminTokenPayload;
    user: AdminTokenPayload;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    /**
     * preHandler that requires a valid admin session cookie. Attach it to
     * any route (or register it as a per-plugin hook) to protect it:
     *
     *   fastify.get("/protected", { preHandler: fastify.authenticate }, handler)
     */
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * Sets up cookie parsing + JWT signing/verification, and exposes a single
 * `fastify.authenticate` guard that every protected admin route (this
 * phase's /auth/me, and every write endpoint added from Phase 4 onward)
 * can reuse. The token itself is never exposed to frontend JS — it only
 * ever travels inside a Secure, httpOnly, SameSite cookie.
 */
export default fp(async function jwtPlugin(fastify: FastifyInstance) {
  await fastify.register(cookie);

  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: SESSION_COOKIE_NAME,
      signed: false,
    },
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  fastify.decorate(
    "authenticate",
    async function authenticate(request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify({ onlyCookie: true });
      } catch {
        // Calling reply.send() here (via sendError) and returning, without
        // throwing, is enough to stop the Fastify lifecycle before the
        // route handler runs — see https://fastify.dev/docs/latest/Reference/Hooks/#respond-to-a-request-from-a-hook
        sendError(reply, 401, "UNAUTHENTICATED", "You must be logged in to do that.");
        return;
      }
    }
  );
});

/**
 * Cookie options shared by login (set) and logout (clear) so the two
 * never drift out of sync. `secure` + `sameSite: "none"` in production
 * because the frontend and API will typically live on different
 * origins (e.g. Vercel + Render); `lax` in development is enough since
 * localhost:5173 and localhost:4000 share the same site.
 */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    path: "/",
  };
}

/**
 * Like `fastify.authenticate`, but never rejects the request — it just
 * tells you whether a valid admin session is present. Routes that show
 * different data to admins vs. the public (e.g. GET /projects including
 * drafts) use this instead of a hard `preHandler` guard.
 */
export async function tryGetAdminId(request: FastifyRequest): Promise<string | null> {
  try {
    const payload = (await request.jwtVerify({ onlyCookie: true })) as unknown as AdminTokenPayload;
    return payload.adminId;
  } catch {
    return null;
  }
}
import type { FastifyInstance } from "fastify";
import { loginSchema } from "./auth.schema.js";
import { touchLastLogin, toPublicAdmin, verifyAdminCredentials } from "./auth.service.js";
import { sendError } from "../../middleware/errorHandler.js";
import { sessionCookieOptions, SESSION_COOKIE_NAME } from "../../plugins/jwt.js";

export default async function authRoutes(fastify: FastifyInstance) {
  // POST /api/v1/auth/login
  fastify.post(
    "/auth/login",
    {
      // Deliberately stricter than the global rate limit — a login form
      // is the one endpoint worth throttling hard against brute force.
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "10 minutes",
        },
      },
    },
    async (request, reply) => {
      const { email, password } = loginSchema.parse(request.body);

      const admin = await verifyAdminCredentials(fastify.prisma, email, password);
      if (!admin) {
        return sendError(reply, 401, "INVALID_CREDENTIALS", "Invalid email or password.");
      }

      const updatedAdmin = await touchLastLogin(fastify.prisma, admin.id);

      const token = await reply.jwtSign({ adminId: admin.id });

      reply.setCookie(SESSION_COOKIE_NAME, token, sessionCookieOptions());

      return reply.send({ admin: toPublicAdmin(updatedAdmin) });
    }
  );

  // GET /api/v1/auth/me
  fastify.get(
    "/auth/me",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const admin = await fastify.prisma.admin.findUnique({
        where: { id: request.user.adminId },
      });

      // Token is valid but the admin behind it no longer exists — clear
      // the stale cookie instead of leaving the client in limbo.
      if (!admin) {
        reply.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
        return sendError(reply, 401, "UNAUTHENTICATED", "Session is no longer valid.");
      }

      return reply.send({ admin: toPublicAdmin(admin) });
    }
  );

  // POST /api/v1/auth/logout
  fastify.post("/auth/logout", async (_request, reply) => {
    reply.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
    return reply.send({ success: true });
  });
}

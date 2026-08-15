import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { mkdir } from "node:fs/promises";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import staticFiles from "@fastify/static";

import { env, isProduction } from "./utils/env.js";
import { UPLOADS_DIR } from "./utils/paths.js";
import corsPlugin from "./plugins/cors.js";
import prismaPlugin from "./plugins/prisma.js";
import jwtPlugin from "./plugins/jwt.js";
import { registerErrorHandler } from "./middleware/errorHandler.js";
import healthRoutes from "./routes/health.js";
import authRoutes from "./modules/auth/auth.routes.js";
import projectRoutes from "./modules/projects/projects.routes.js";
import uploadRoutes from "./modules/uploads/uploads.routes.js";
import serviceRoutes from "./modules/services/services.routes.js";
import technologyRoutes from "./modules/technologies/technologies.routes.js";
import messageRoutes from "./modules/messages/messages.routes.js";
import settingsRoutes from "./modules/settings/settings.routes.js";

const API_PREFIX = "/api/v1";

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: isProduction ? "info" : "debug",
      transport: isProduction
        ? undefined
        : {
            target: "pino-pretty",
            options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" },
          },
    },
    trustProxy: true,
  });

  // --- core plugins -------------------------------------------------
  await fastify.register(sensible);
  await fastify.register(helmet, {
    // The admin dashboard is a separate SPA route served by the frontend,
    // not by this API, so a strict default CSP here is safe.
    global: true,
    // Default CORP is "same-origin", which would block the frontend
    // (a different origin in dev and typically in prod too) from
    // loading images served from /uploads. This API's whole job is to
    // serve that content cross-origin, so relax it explicitly.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });
  await fastify.register(corsPlugin);
  await fastify.register(prismaPlugin);
  await fastify.register(jwtPlugin);
  await fastify.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  });
  // Must exist before @fastify/static registers against it below.
  await mkdir(UPLOADS_DIR, { recursive: true });

  // Serves backend/uploads at /uploads/<filename> — deliberately outside
  // the /api/v1 prefix since these are static assets, not API responses.
  // imageUrl values point straight here (e.g. "/uploads/abc123.jpg").
  await fastify.register(staticFiles, {
    root: UPLOADS_DIR,
    prefix: "/uploads/",
    decorateReply: false,
  });

  // --- error handling -------------------------------------------------
  registerErrorHandler(fastify);

  // --- request logging -------------------------------------------------
  fastify.addHook("onResponse", (request, reply, done) => {
    request.log.info(
      { method: request.method, url: request.url, statusCode: reply.statusCode },
      "request completed"
    );
    done();
  });

  // --- versioned routes -------------------------------------------------
  await fastify.register(
    async (instance) => {
      await instance.register(healthRoutes);
      await instance.register(authRoutes);
      await instance.register(projectRoutes);
      await instance.register(uploadRoutes);
      await instance.register(serviceRoutes);
      await instance.register(technologyRoutes);
      await instance.register(messageRoutes);
      await instance.register(settingsRoutes);
    },
    { prefix: API_PREFIX }
  );

  return fastify;
}

export { env };

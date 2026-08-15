import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { env } from "../utils/env.js";

/**
 * Only the configured frontend origin may call this API. `credentials: true`
 * is enabled now so Phase 2's cookie-based admin session works without
 * revisiting CORS config later.
 */
export default fp(async function corsPlugin(fastify: FastifyInstance) {
  await fastify.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  });
});

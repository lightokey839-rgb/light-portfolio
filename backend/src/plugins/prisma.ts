import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { isProduction } from "../utils/env.js";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

/**
 * Registers a single shared PrismaClient on the Fastify instance
 * (fastify.prisma) and disconnects it cleanly when the server closes,
 * so we never leak database connections between restarts.
 */
export default fp(async function prismaPlugin(fastify: FastifyInstance) {
  const prisma = new PrismaClient({
    log: isProduction ? ["error", "warn"] : ["warn", "error"],
  });

  await prisma.$connect();

  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async (instance) => {
    await instance.prisma.$disconnect();
  });
});

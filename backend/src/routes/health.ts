import type { FastifyInstance } from "fastify";

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async () => {
    let database: "connected" | "unreachable" = "connected";

    try {
      await fastify.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = "unreachable";
    }

    return {
      status: database === "connected" ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      database,
    };
  });
}

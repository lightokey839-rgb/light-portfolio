import { buildApp, env } from "./app.js";

async function main() {
  const fastify = await buildApp();

  try {
    await fastify.listen({ port: env.PORT, host: "0.0.0.0" });
    fastify.log.info(`API listening on http://localhost:${env.PORT}/api/v1`);
    fastify.log.info(`Health check: http://localhost:${env.PORT}/api/v1/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    fastify.log.info(`Received ${signal}, shutting down gracefully...`);
    await fastify.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal error during startup:", err);
  process.exit(1);
});

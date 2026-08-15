import type { FastifyInstance } from "fastify";
import { updateSettingsSchema } from "./settings.schema.js";
import { getSettings, updateSettings } from "./settings.service.js";

export default async function settingsRoutes(fastify: FastifyInstance) {
  // GET /api/v1/settings
  // Public — this is what the live site reads (name, title, bio, socials)
  // instead of the old hardcoded src/data/site.ts content.
  fastify.get("/settings", async () => {
    const settings = await getSettings(fastify.prisma);
    return { settings };
  });

  // PATCH /api/v1/settings
  fastify.patch("/settings", { preHandler: fastify.authenticate }, async (request) => {
    const input = updateSettingsSchema.parse(request.body);
    const settings = await updateSettings(fastify.prisma, input);
    return { settings };
  });
}

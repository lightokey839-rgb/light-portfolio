import type { FastifyInstance } from "fastify";
import { createServiceSchema, updateServiceSchema } from "./services.schema.js";
import {
  createService,
  deleteService,
  getServiceById,
  listServices,
  updateService,
} from "./services.service.js";
import { sendError } from "../../middleware/errorHandler.js";

export default async function serviceRoutes(fastify: FastifyInstance) {
  // GET /api/v1/services
  // No auth required — every service is always public (no draft state).
  fastify.get("/services", async () => {
    const services = await listServices(fastify.prisma);
    return { services };
  });

  // GET /api/v1/services/:id
  fastify.get<{ Params: { id: string } }>("/services/:id", async (request, reply) => {
    const service = await getServiceById(fastify.prisma, request.params.id);

    if (!service) {
      return sendError(reply, 404, "NOT_FOUND", "Service not found.");
    }

    return { service };
  });

  // POST /api/v1/services
  fastify.post("/services", { preHandler: fastify.authenticate }, async (request, reply) => {
    const input = createServiceSchema.parse(request.body);
    const service = await createService(fastify.prisma, input);
    return reply.status(201).send({ service });
  });

  // PATCH /api/v1/services/:id
  fastify.patch<{ Params: { id: string } }>(
    "/services/:id",
    { preHandler: fastify.authenticate },
    async (request) => {
      const input = updateServiceSchema.parse(request.body);
      const service = await updateService(fastify.prisma, request.params.id, input);
      return { service };
    }
  );

  // DELETE /api/v1/services/:id
  fastify.delete<{ Params: { id: string } }>(
    "/services/:id",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      await deleteService(fastify.prisma, request.params.id);
      return reply.status(204).send();
    }
  );
}

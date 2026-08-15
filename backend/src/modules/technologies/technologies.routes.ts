import type { FastifyInstance } from "fastify";
import { createTechnologySchema, updateTechnologySchema } from "./technologies.schema.js";
import {
  createTechnology,
  deleteTechnology,
  getTechnologyById,
  listTechnologies,
  updateTechnology,
} from "./technologies.service.js";
import { sendError } from "../../middleware/errorHandler.js";

export default async function technologyRoutes(fastify: FastifyInstance) {
  // GET /api/v1/technologies
  // No auth required, and no admin/public split like /projects has — every
  // technology is always visible, since the model has no `published` field.
  fastify.get("/technologies", async () => {
    const technologies = await listTechnologies(fastify.prisma);
    return { technologies };
  });

  // GET /api/v1/technologies/:id
  fastify.get<{ Params: { id: string } }>("/technologies/:id", async (request, reply) => {
    const technology = await getTechnologyById(fastify.prisma, request.params.id);

    if (!technology) {
      return sendError(reply, 404, "NOT_FOUND", "Technology not found.");
    }

    return { technology };
  });

  // POST /api/v1/technologies
  fastify.post(
    "/technologies",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const input = createTechnologySchema.parse(request.body);
      const technology = await createTechnology(fastify.prisma, input);
      return reply.status(201).send({ technology });
    }
  );

  // PATCH /api/v1/technologies/:id
  fastify.patch<{ Params: { id: string } }>(
    "/technologies/:id",
    { preHandler: fastify.authenticate },
    async (request) => {
      const input = updateTechnologySchema.parse(request.body);
      const technology = await updateTechnology(fastify.prisma, request.params.id, input);
      return { technology };
    }
  );

  // DELETE /api/v1/technologies/:id
  fastify.delete<{ Params: { id: string } }>(
    "/technologies/:id",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      await deleteTechnology(fastify.prisma, request.params.id);
      return reply.status(204).send();
    }
  );
}

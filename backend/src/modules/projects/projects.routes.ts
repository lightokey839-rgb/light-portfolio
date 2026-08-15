import type { FastifyInstance } from "fastify";
import {
  createProjectSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
} from "./projects.schema.js";
import {
  createProject,
  deleteProject,
  getProjectById,
  listProjects,
  updateProject,
} from "./projects.service.js";
import { sendError } from "../../middleware/errorHandler.js";
import { tryGetAdminId } from "../../plugins/jwt.js";

export default async function projectRoutes(fastify: FastifyInstance) {
  // GET /api/v1/projects
  // No auth required. Anonymous callers (the future public site) only
  // ever see published projects; a valid admin session additionally
  // sees drafts and unlocks the status/search/sort/pagination filters.
  fastify.get("/projects", async (request) => {
    const query = listProjectsQuerySchema.parse(request.query);
    const adminId = await tryGetAdminId(request);
    return listProjects(fastify.prisma, query, Boolean(adminId));
  });

  // GET /api/v1/projects/:id
  fastify.get<{ Params: { id: string } }>("/projects/:id", async (request, reply) => {
    const adminId = await tryGetAdminId(request);
    const project = await getProjectById(fastify.prisma, request.params.id, Boolean(adminId));

    if (!project) {
      return sendError(reply, 404, "NOT_FOUND", "Project not found.");
    }

    return { project };
  });

  // POST /api/v1/projects
  fastify.post("/projects", { preHandler: fastify.authenticate }, async (request, reply) => {
    const input = createProjectSchema.parse(request.body);
    const project = await createProject(fastify.prisma, input);
    return reply.status(201).send({ project });
  });

  // PATCH /api/v1/projects/:id
  fastify.patch<{ Params: { id: string } }>(
    "/projects/:id",
    { preHandler: fastify.authenticate },
    async (request) => {
      const input = updateProjectSchema.parse(request.body);
      const project = await updateProject(fastify.prisma, request.params.id, input);
      return { project };
    }
  );

  // DELETE /api/v1/projects/:id
  fastify.delete<{ Params: { id: string } }>(
    "/projects/:id",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      await deleteProject(fastify.prisma, request.params.id);
      return reply.status(204).send();
    }
  );
}

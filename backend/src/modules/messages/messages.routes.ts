import type { FastifyInstance } from "fastify";
import {
  createMessageSchema,
  listMessagesQuerySchema,
  updateMessageSchema,
} from "./messages.schema.js";
import {
  createMessage,
  deleteMessage,
  listMessages,
  updateMessage,
} from "./messages.service.js";

export default async function messageRoutes(fastify: FastifyInstance) {
  // POST /api/v1/messages
  // Public and unauthenticated — this is what the portfolio's contact form
  // submits to. Deliberately rate-limited harder than the global default,
  // the same way /auth/login is, since an open write endpoint is the
  // obvious spam target. Always responds 201 with the same minimal body,
  // whether or not the submission was actually persisted (see
  // messages.service.ts for the honeypot check) — the visitor's own
  // message is never echoed back, since nothing here needs it.
  fastify.post(
    "/messages",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "10 minutes",
        },
      },
    },
    async (request, reply) => {
      const input = createMessageSchema.parse(request.body);
      await createMessage(fastify.prisma, input);
      return reply.status(201).send({ success: true });
    }
  );

  // GET /api/v1/messages
  // Admin only — these are private contact-form submissions, not public data.
  fastify.get("/messages", { preHandler: fastify.authenticate }, async (request) => {
    const query = listMessagesQuerySchema.parse(request.query);
    const messages = await listMessages(fastify.prisma, query);
    return { messages };
  });

  // PATCH /api/v1/messages/:id
  fastify.patch<{ Params: { id: string } }>(
    "/messages/:id",
    { preHandler: fastify.authenticate },
    async (request) => {
      const input = updateMessageSchema.parse(request.body);
      const message = await updateMessage(fastify.prisma, request.params.id, input);
      return { message };
    }
  );

  // DELETE /api/v1/messages/:id
  fastify.delete<{ Params: { id: string } }>(
    "/messages/:id",
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      await deleteMessage(fastify.prisma, request.params.id);
      return reply.status(204).send();
    }
  );
}

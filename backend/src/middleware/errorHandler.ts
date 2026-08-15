import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from "fastify";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { isProduction } from "../utils/env.js";

interface ApiErrorBody {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export function sendError(
  reply: FastifyReply,
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  const body: ApiErrorBody = { error: { message, code } };
  if (details !== undefined) body.error.details = details;
  return reply.status(status).send(body);
}

/**
 * Single place all errors flow through. Nothing here ever leaks a stack
 * trace, a raw database error, or internal file paths to the client —
 * those are logged server-side only.
 */
export function registerErrorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler(
    (error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
      request.log.error({ err: error, url: request.url }, "request error");

      // Zod validation errors -> 400 with field-level details
      if (error instanceof ZodError) {
        return sendError(
          reply,
          400,
          "VALIDATION_ERROR",
          "The request contains invalid data.",
          error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          }))
        );
      }

      // Known Prisma errors -> map to sensible HTTP codes, never expose raw SQL/driver text
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return sendError(
            reply,
            409,
            "DUPLICATE_ENTRY",
            "A record with this value already exists."
          );
        }
        if (error.code === "P2025") {
          return sendError(reply, 404, "NOT_FOUND", "The requested record was not found.");
        }
        return sendError(reply, 400, "DATABASE_ERROR", "The request could not be processed.");
      }

      // Fastify's own validation (schema-based route validation)
      if ("validation" in error && error.validation) {
        return sendError(reply, 400, "VALIDATION_ERROR", "The request contains invalid data.");
      }

      const statusCode =
        "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500;

      // For anything unexpected, only ever show a generic message in production
      const message =
        statusCode < 500 ? error.message : isProduction ? "Something went wrong. Please try again." : error.message;

      return sendError(reply, statusCode, statusCode < 500 ? "REQUEST_ERROR" : "INTERNAL_ERROR", message);
    }
  );

  fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    return sendError(reply, 404, "NOT_FOUND", `Route ${request.method} ${request.url} not found.`);
  });
}

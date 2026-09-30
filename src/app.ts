import Fastify, { type FastifyInstance } from "fastify";

import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";

import { env } from "./config/env.js";
import { AppError } from "./lib/app-error.js";

import { healthRoutes } from "./routes/health.route.js";
import { authRoutes } from "./modules/auth/auth.route.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL
    },

    requestIdHeader: "x-request-id",

    disableRequestLogging: false
  });

  //Global error handler
  app.setErrorHandler(
    (error, request, reply) => {
      if (error instanceof AppError) {
        return reply.status(
          error.statusCode
        ).send({
          error: {
            code: error.code,
            message: error.message
          }
        });
      }

      const errorCode =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? (error as { code?: unknown }).code
          : undefined;

      if (
        errorCode ===
          "FST_JWT_NO_AUTHORIZATION_IN_HEADER" ||
        errorCode ===
          "FST_JWT_AUTHORIZATION_TOKEN_INVALID" ||
        errorCode ===
          "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED"
      ) {
        return reply.status(401).send({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication is required"
          }
        });
      }

      request.log.error(
        { error },
        "Unhandled application error"
      );

      return reply.status(500).send({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong"
        }
      });
    }
  );

  await app.register(helmet);

  await app.register(cors, {
    origin: false
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: "15m"
    }
  });

  await app.register(healthRoutes, {
    prefix: "/api/v1"
  });

  await app.register(authRoutes, {
    prefix: "/api/v1/auth"
  });

  return app;
}
import Fastify, { type FastifyInstance } from "fastify";

import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";

import { env } from "./config/env.js";
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
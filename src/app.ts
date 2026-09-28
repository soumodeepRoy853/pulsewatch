import Fastify, { type FastifyInstance } from "fastify";

import cors from "@fastify/cors";
import helmet from "@fastify/helmet";

import { env } from "./config/env.js";
import { healthRoutes } from "./routes/health.route.js";

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

    await app.register(healthRoutes, {
        prefix: "/api/v1"
    });

    return app;
}
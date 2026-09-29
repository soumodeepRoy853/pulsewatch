import type { FastifyInstance, FastifyPluginOptions } from "fastify";

import { sql } from "drizzle-orm";

import { db } from "../db/client.js";

export async function healthRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  app.get("/health", async () => {
    return {
      status: "ok",
      service: "pulsewatch-api"
    };
  });

  app.get("/ready", async (_request, reply) => {
    try {
      await db.execute(sql`SELECT 1`);

      return {
        status: "ok",
        checks: {
          process: "ok",
          postgres: "ok"
        }
      };
    } catch (error) {
      app.log.error(
        { error },
        "PostgreSQL readiness check failed"
      );

      return reply.status(503).send({
        status: "not_ready",
        checks: {
          process: "ok",
          postgres: "failed"
        }
      });
    }
  });
}
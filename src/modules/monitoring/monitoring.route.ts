import crypto from "node:crypto";
import type { FastifyInstance, FastifyPluginOptions } from "fastify";

import { authenticate } from "../auth/auth.middleware.js";
import { requirePermission } from "../auth/authorization.js";

import { executeMonitorCheck } from "./check.service.js";

export async function monitoringRoutes(app: FastifyInstance, _options: FastifyPluginOptions,): Promise<void> {
  app.post(
    "/:monitorId/check",
    {
      preHandler: [authenticate, requirePermission("monitor:read")],
    },
    async (request, reply) => {
      const { monitorId } = request.params as {
        monitorId: string;
      };

      const executionId = `manual:${crypto.randomUUID()}`;
      const check = await executeMonitorCheck(monitorId, executionId);
 
      return reply.status(200).send({
        data: check,
      });
    },
  );
}

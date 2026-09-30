import type { FastifyInstance, FastifyPluginOptions } from "fastify";

import { authenticate } from "../auth/auth.middleware.js";
import { requirePermission } from "../auth/authorization.js";

import { createMonitorSchema, monitorIdSchema, updateMonitorSchema, } from "./monitor.schema.js";

import { createMonitor, deleteMonitor, getMonitor, listMonitors, updateMonitor, } from "./monitor.service.js";


export async function monitorRoutes(app: FastifyInstance, _options: FastifyPluginOptions,): Promise<void> {
  //CREATE
  app.post(
    "/",
    {
      preHandler: [authenticate, requirePermission("monitor:create")],
    },
    async (request, reply) => {
      const parsed = createMonitorSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: parsed.error.flatten(),
          },
        });
      }

      const monitor = await createMonitor(
        request.user.organizationId,
        parsed.data,
      );

      return reply.status(201).send({
        data: monitor,
      });
    },
  );

  //LIST
  app.get(
    "/",
    {
      preHandler: [authenticate, requirePermission("monitor:read")],
    },
    async (request, reply) => {
      const monitors = await listMonitors(request.user.organizationId);

      return reply.status(200).send({
        data: monitors,
      });
    },
  );

  //GET ONE
  app.get(
    "/:id",
    {
      preHandler: [authenticate, requirePermission("monitor:read")],
    },
    async (request, reply) => {
      const parsed = monitorIdSchema.safeParse(request.params);

      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "INVALID_MONITOR_ID",
            message: "Invalid monitor ID",
          },
        });
      }

      const monitor = await getMonitor(
        request.user.organizationId,
        parsed.data.id,
      );

      return reply.status(200).send({
        data: monitor,
      });
    },
  );

  //UPDATE
  app.patch(
    "/:id",
    {
      preHandler: [authenticate, requirePermission("monitor:update")],
    },
    async (request, reply) => {
      const params = monitorIdSchema.safeParse(request.params);

      if (!params.success) {
        return reply.status(400).send({
          error: {
            code: "INVALID_MONITOR_ID",
            message: "Invalid monitor ID",
          },
        });
      }

      const body = updateMonitorSchema.safeParse(request.body);

      if (!body.success) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: body.error.flatten(),
          },
        });
      }

      const monitor = await updateMonitor(
        request.user.organizationId,
        params.data.id,
        body.data,
      );

      return reply.status(200).send({
        data: monitor,
      });
    },
  );

  //DELETE
  app.delete(
    "/:id",
    {
      preHandler: [authenticate, requirePermission("monitor:delete")],
    },
    async (request, reply) => {
      const parsed = monitorIdSchema.safeParse(request.params);

      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: "INVALID_MONITOR_ID",
            message: "Invalid monitor ID",
          },
        });
      }

      await deleteMonitor(request.user.organizationId, parsed.data.id);

      return reply.status(204).send();
    },
  );
}

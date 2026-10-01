import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "../../db/client.js";
import { monitors } from "../../db/schema/monitors.js";

import { AppError } from "../../lib/app-error.js";

import type { CreateMonitorInput, UpdateMonitorInput } from "./monitor.schema.js";
import { validateMonitorUrl } from "../monitoring/url-security.js";
import { removeMonitorSchedule, scheduleMonitor} from "../../queue/monitor.scheduler.js";


export async function createMonitor(organizationId: string, input: CreateMonitorInput,) {
  await validateMonitorUrl(input.url);

  const [monitor] = await db
    .insert(monitors)
    .values({
      organizationId,
      name: input.name,
      url: input.url,
      method: input.method,
      intervalSeconds: input.intervalSeconds,
      timeoutMs: input.timeoutMs,
      expectedStatus: input.expectedStatus,
      latencyThresholdMs: input.latencyThresholdMs,
      failureThreshold: input.failureThreshold,
      recoveryThreshold: input.recoveryThreshold,
      enabled: input.enabled
    })
    .returning();

  if (!monitor) {
    throw new AppError(
      "MONITOR_CREATION_FAILED",
      "Failed to create monitor",
      500,
    );
  }
  if (monitor.enabled) {
    await scheduleMonitor(
      monitor.id,
      monitor.intervalSeconds,
    );
  }

  return monitor;
}

export async function listMonitors(organizationId: string) {
  return db
    .select()
    .from(monitors)
    .where(
      and(
        eq(monitors.organizationId, organizationId),
        isNull(monitors.deletedAt),
      ),
    )
    .orderBy(desc(monitors.createdAt));
}

export async function getMonitor(organizationId: string, monitorId: string) {
  const [monitor] = await db
    .select()
    .from(monitors)
    .where(
      and(
        eq(monitors.id, monitorId),

        // 🔐 Organization isolation
        eq(monitors.organizationId, organizationId),

        isNull(monitors.deletedAt),
      ),
    )
    .limit(1);

  if (!monitor) {
    throw new AppError("MONITOR_NOT_FOUND", "Monitor not found", 404);
  }

  return monitor;
}

export async function updateMonitor(organizationId: string, monitorId: string, input: UpdateMonitorInput,) {

  //First verify that this monitor belongs to the authenticated organization.
   const existingMonitor = await getMonitor(organizationId, monitorId);

   const [monitor] = await db
     .update(monitors)
     .set({
       ...input,
       updatedAt: new Date(),
     })
     .where(
       and(
         eq(monitors.id, monitorId),
         eq(monitors.organizationId, organizationId),
         isNull(monitors.deletedAt),
       ),
     )
     .returning();

   if (!monitor) {
     throw new AppError(
       "MONITOR_UPDATE_FAILED",
       "Failed to update monitor",
       500,
     );
   }

   const schedulerNeedsUpdate =
     existingMonitor.intervalSeconds !== monitor.intervalSeconds ||
     existingMonitor.enabled !== monitor.enabled;

   if (schedulerNeedsUpdate) {
     if (monitor.enabled) {
       await scheduleMonitor(monitor.id, monitor.intervalSeconds);
     } else {
       await removeMonitorSchedule(monitor.id);
     }
   }

   return monitor;
}

export async function deleteMonitor(organizationId: string, monitorId: string,): Promise<void> {
  // Soft delete the monitor.
  const result = await db
    .update(monitors)
    .set({
      deletedAt: new Date(),
      enabled: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(monitors.id, monitorId),
        eq(monitors.organizationId, organizationId),
        isNull(monitors.deletedAt),
      ),
    )
    .returning({
      id: monitors.id,
    });

  const deletedMonitor = result[0];

  if (!deletedMonitor) {
    throw new AppError("MONITOR_NOT_FOUND", "Monitor not found", 404);
  }

  // Remove the monitor's recurring BullMQ scheduler.
  await removeMonitorSchedule(deletedMonitor.id);
}

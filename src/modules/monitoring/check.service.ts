import { eq } from "drizzle-orm";

import { db } from "../../db/client.js";

import { monitors } from "../../db/schema/monitors.js";
import { monitorChecks } from "../../db/schema/monitor_checks.js";

import { checkHttpEndpoint } from "./http-checker.js";

export async function executeMonitorCheck(monitorId: string) {
  const [monitor] = await db
    .select()
    .from(monitors)
    .where(eq(monitors.id, monitorId))
    .limit(1);

  if (!monitor) {
    throw new Error("MONITOR_NOT_FOUND");
  }

  if (!monitor.enabled || monitor.deletedAt) {
    return null;
  }

  const result = await checkHttpEndpoint(
    monitor.url,
    monitor.method as "GET" | "HEAD",
    monitor.timeoutMs,
    monitor.expectedStatus,
  );

  const [check] = await db
    .insert(monitorChecks)
    .values({
      monitorId: monitor.id,

      status: result.status,

      statusCode: result.statusCode,

      responseTimeMs: result.responseTimeMs,

      errorType: result.errorType,

      errorMessage: result.errorMessage,
    })
    .returning();

  return check;
}

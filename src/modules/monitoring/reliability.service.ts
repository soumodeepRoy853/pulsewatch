import { and, eq, isNull } from "drizzle-orm";

import { db } from "../../db/client.js";
import { incidents } from "../../db/schema/incidents.js";
import { monitors } from "../../db/schema/monitors.js";
import { incidentEvents } from "../../db/schema/incident-events.js";
import { AppError } from "../../lib/app-error.js";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type CheckOutcome = "SUCCESS" | "FAILURE";

export interface ProcessCheckInput {
  organizationId: string;
  monitorId: string;
  outcome: CheckOutcome;
  errorMessage?: string | null;
}

export interface ReliabilityResult {
  previousStatus: string;
  currentStatus: string;
  incidentCreated: boolean;
  incidentResolved: boolean;
}

export async function processCheckResult(
  tx: DbTransaction,
  input: ProcessCheckInput,
): Promise<ReliabilityResult> {
  return db.transaction(async (tx) => {
    const [monitor] = await tx
      .select({
        id: monitors.id,
        organizationId: monitors.organizationId,
        status: monitors.status,
        failureThreshold: monitors.failureThreshold,
        recoveryThreshold: monitors.recoveryThreshold,
        consecutiveFailures: monitors.consecutiveFailures,
        consecutiveSuccesses: monitors.consecutiveSuccesses,
      })
      .from(monitors)
      .where(
        and(
          eq(monitors.id, input.monitorId),
          eq(monitors.organizationId, input.organizationId),
          isNull(monitors.deletedAt),
        ),
      )
      .for("update")
      .limit(1);

    if (!monitor) {
      throw new AppError("MONITOR_NOT_FOUND", "Monitor not found", 404);
    }

    const previousStatus = monitor.status;

    let nextStatus = monitor.status;

    let consecutiveFailures = monitor.consecutiveFailures;

    let consecutiveSuccesses = monitor.consecutiveSuccesses;

    if (input.outcome === "FAILURE") {
      consecutiveFailures += 1;
      consecutiveSuccesses = 0;

      if (consecutiveFailures >= monitor.failureThreshold) {
        nextStatus = "DOWN";
      }
    } else {
      consecutiveSuccesses += 1;
      consecutiveFailures = 0;

      if (consecutiveSuccesses >= monitor.recoveryThreshold) {
        nextStatus = "HEALTHY";
      }
    }

    await tx
      .update(monitors)
      .set({
        status: nextStatus,
        consecutiveFailures,
        consecutiveSuccesses,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(monitors.id, monitor.id),
          eq(monitors.organizationId, input.organizationId),
        ),
      );

    let incidentCreated = false;
    let incidentResolved = false;

    // Monitor crossed the failure threshold.
    if (previousStatus !== "DOWN" && nextStatus === "DOWN") {
      incidentCreated = await createIncident(tx, input, monitor.id);
    }

    // Monitor crossed the recovery threshold.
    if (previousStatus === "DOWN" && nextStatus === "HEALTHY") {
      incidentResolved = await resolveIncident(
        tx,
        input.organizationId,
        monitor.id,
      );
    }

    return {
      previousStatus,
      currentStatus: nextStatus,
      incidentCreated,
      incidentResolved,
    };
  });
}

async function resolveIncident(
  tx: DbTransaction,
  organizationId: string,
  monitorId: string,
): Promise<boolean> {
  const [incident] = await tx
    .select({
      id: incidents.id,
    })
    .from(incidents)
    .where(
      and(
        eq(incidents.monitorId, monitorId),
        eq(incidents.organizationId, organizationId),
        eq(incidents.status, "OPEN"),
      ),
    )
    .limit(1);

  if (!incident) {
    return false;
  }

  await tx
    .update(incidents)
    .set({
      status: "RESOLVED",
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(incidents.id, incident.id));

  await tx.insert(incidentEvents).values({
    incidentId: incident.id,
    type: "INCIDENT_RESOLVED",
    message: "Monitor recovered successfully",
    metadata: {
      monitorId,
    },
  });

  return true;
}

async function createIncident(
  tx: DbTransaction,
  input: ProcessCheckInput,
  monitorId: string,
): Promise<boolean> {
  const [existingIncident] = await tx
    .select({
      id: incidents.id,
    })
    .from(incidents)
    .where(
      and(
        eq(incidents.monitorId, monitorId),
        eq(incidents.organizationId, input.organizationId),
        eq(incidents.status, "OPEN"),
      ),
    )
    .limit(1);

  if (existingIncident) {
    return false;
  }

  const [incident] = await tx
    .insert(incidents)
    .values({
      organizationId: input.organizationId,
      monitorId,
      title: "Monitor is down",
      status: "OPEN",
      severity: "CRITICAL",
      startedAt: new Date(),
    })
    .returning({
      id: incidents.id,
    });

  if (!incident) {
    throw new AppError(
      "INCIDENT_CREATE_FAILED",
      "Failed to create incident",
      500,
    );
  }

  await tx.insert(incidentEvents).values({
    incidentId: incident.id,
    type: "INCIDENT_CREATED",
    message:
      input.errorMessage ?? "Monitor reached the configured failure threshold",
    metadata: {
      monitorId,
    },
  });

  return true;
}

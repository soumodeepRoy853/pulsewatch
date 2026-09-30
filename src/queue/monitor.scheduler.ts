import { monitorQueue } from "./monitor.queue.js";

export function getMonitorSchedulerId(monitorId: string): string {
  return `monitor:${monitorId}`;
}

export async function scheduleMonitor(
  monitorId: string,
  intervalSeconds: number
): Promise<void> {
  const schedulerId = getMonitorSchedulerId(monitorId);

  await monitorQueue.upsertJobScheduler(
    schedulerId,
    {
      every: intervalSeconds * 1000
    },
    {
      name: "check-monitor",
      data: { monitorId },
      opts: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000
        },
        removeOnComplete: {
          age: 60 * 60
        },
        removeOnFail: {
          age: 24 * 60 * 60
        }
      }
    }
  );
}

export async function removeMonitorSchedule(
  monitorId: string
): Promise<void> {
  const schedulerId = getMonitorSchedulerId(monitorId);

  await monitorQueue.removeJobScheduler(schedulerId);
}
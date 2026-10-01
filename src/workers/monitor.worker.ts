import { Worker, type Job } from "bullmq";

import { redis } from "../queue/redis.js";
import { MONITOR_QUEUE_NAME } from "../queue/monitor.queue.js";

import { executeMonitorCheck } from "../modules/monitoring/check.service.js";

interface MonitorCheckJob {
  monitorId: string;
}

export const monitorWorker = new Worker<MonitorCheckJob>(
  MONITOR_QUEUE_NAME,

  async (job: Job<MonitorCheckJob>) => {
    return await executeMonitorCheck(
      job.data.monitorId,
      job.id!,
    );
  },

  {
    connection: redis,

    concurrency: 10,

    limiter: {
      max: 100,
      duration: 1000,
    },
  },
);

monitorWorker.on("completed", (job, result) => {
  console.log("Monitor check completed", {
    jobId: job.id,
    monitorId: job.data.monitorId,
    status: result?.check?.status,
    monitorStatus: result?.reliability?.currentStatus,
    incidentCreated: result?.reliability?.incidentCreated,
    incidentResolved: result?.reliability?.incidentResolved,
  });
});

monitorWorker.on("failed", (job, error) => {
  console.error(`Monitor check failed: ${job?.id}`, error);
});

monitorWorker.on("error", (error) => {
  console.error("Monitor worker error", error);
});

import { Queue } from "bullmq";

import { redis } from "./redis.js";

export const MONITOR_QUEUE_NAME = "monitor-checks";

export const monitorQueue = new Queue(MONITOR_QUEUE_NAME, {
  connection: redis,

  defaultJobOptions: {
    attempts: 3,

    backoff: {
      type: "exponential",
      delay: 1000,
    },

    removeOnComplete: {
      age: 60 * 60,
    },

    removeOnFail: {
      age: 24 * 60 * 60,
    },
  },
});

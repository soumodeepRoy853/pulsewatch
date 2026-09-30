import "./config/env.js";

import { monitorWorker } from "./workers/monitor.worker.js";

console.log("PulseWatch monitor worker started");

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received. Shutting down worker...`);

  await monitorWorker.close();

  console.log("Monitor worker stopped");

  process.exit(0);
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

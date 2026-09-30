import { z } from "zod";

const monitorMethodSchema = z.enum(["GET", "HEAD"]);

const monitorUrlSchema = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine(
    (value) => {
      const url = new URL(value);

      return url.protocol === "http:" || url.protocol === "https:";
    },
    {
      message: "Monitor URL must use HTTP or HTTPS",
    },
  )
  .refine(
    (value) => {
      const url = new URL(value);

      return url.username === "" && url.password === "";
    },
    {
      message: "Monitor URL cannot contain credentials",
    },
  );

export const createMonitorSchema = z.object({
  name: z.string().trim().min(1).max(120),

  url: monitorUrlSchema,

  method: monitorMethodSchema.default("GET"),

  intervalSeconds: z.number().int().min(10).max(86400).default(60),

  timeoutMs: z.number().int().min(1000).max(30000).default(5000),

  expectedStatus: z.number().int().min(100).max(599).default(200),

  latencyThresholdMs: z.number().int().min(1).max(30000).default(1000),

  failureThreshold: z.number().int().min(1).max(10).default(3),

  recoveryThreshold: z.number().int().min(1).max(10).default(2),

  enabled: z.boolean().default(true),
});

export const updateMonitorSchema = createMonitorSchema.partial();

export const monitorIdSchema = z.object({
  id: z.string().uuid(),
});

export type CreateMonitorInput = z.infer<typeof createMonitorSchema>;

export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>;

import {
  boolean,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { organizations } from "./organizations.js";

export const monitors = pgTable(
  "monitors",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", {
      length: 120,
    }).notNull(),

    url: varchar("url", {
      length: 2048,
    }).notNull(),

    method: varchar("method", {
      length: 10,
    })
      .notNull()
      .default("GET"),

    intervalSeconds: integer("interval_seconds").notNull().default(60),

    timeoutMs: integer("timeout_ms").notNull().default(5000),

    expectedStatus: integer("expected_status").notNull().default(200),

    latencyThresholdMs: integer("latency_threshold_ms").notNull().default(1000),

    failureThreshold: integer("failure_threshold").notNull().default(3),

    recoveryThreshold: integer("recovery_threshold").notNull().default(2),

    status: varchar("status", {
      length: 20,
    })
      .notNull()
      .default("UNKNOWN"),

    enabled: boolean("enabled").notNull().default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    deletedAt: timestamp("deleted_at", {
      withTimezone: true,
    }),
  },
  (table) => ({
    organizationIdx: index("monitors_organization_idx").on(
      table.organizationId,
    ),

    organizationEnabledIdx: index("monitors_organization_enabled_idx").on(
      table.organizationId,
      table.enabled,
    ),

    organizationDeletedIdx: index("monitors_organization_deleted_idx").on(
      table.organizationId,
      table.deletedAt,
    ),
  }),
);

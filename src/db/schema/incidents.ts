import { index, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { monitors } from "./monitors.js";
import { organizations } from "./organizations.js";

export const incidents = pgTable(
  "incidents",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),

    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => monitors.id, {
        onDelete: "cascade",
      }),

    title: varchar("title", { length: 255 }).notNull(),

    status: varchar("status", { length: 30 }).notNull().default("OPEN"),

    severity: varchar("severity", { length: 20 }).notNull().default("CRITICAL"),

    startedAt: timestamp("started_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    acknowledgedAt: timestamp("acknowledged_at", {
      withTimezone: true,
    }),

    resolvedAt: timestamp("resolved_at", {
      withTimezone: true,
    }),

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
  },

  (table) => ({
    organizationIdx: index("incidents_organization_idx").on(
      table.organizationId,
    ),

    monitorIdx: index("incidents_monitor_idx").on(table.monitorId),

    monitorStatusIdx: index("incidents_monitor_status_idx").on(
      table.monitorId,
      table.status,
    ),

    organizationStatusIdx: index("incidents_organization_status_idx").on(
      table.organizationId,
      table.status,
    ),

    openIncidentPerMonitorIdx: uniqueIndex("incidents_one_open_per_monitor_idx")
      .on(table.monitorId)
      .where(sql`${table.status} = 'OPEN'`),
  }),
);

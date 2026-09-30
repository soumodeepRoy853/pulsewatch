import {
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
  text,
} from "drizzle-orm/pg-core";

import { monitors } from "./monitors.js";

export const monitorChecks = pgTable(
  "monitor_checks",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    monitorId: uuid("monitor_id")
      .notNull()
      .references(() => monitors.id, {
        onDelete: "cascade",
      }),

    status: varchar("status", {
      length: 20,
    }).notNull(),

    statusCode: integer("status_code"),

    responseTimeMs: integer("response_time_ms"),

    errorType: varchar("error_type", {
      length: 50,
    }),

    errorMessage: text("error_message"),

    checkedAt: timestamp("checked_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    monitorCheckedAtIdx: index("monitor_checks_monitor_checked_at_idx").on(
      table.monitorId,
      table.checkedAt,
    ),
  }),
);

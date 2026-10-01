import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { incidents } from "./incidents.js";
import { users } from "./users.js";

export const incidentEvents = pgTable(
  "incident_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    incidentId: uuid("incident_id")
      .notNull()
      .references(() => incidents.id, {
        onDelete: "cascade",
      }),

    type: varchar("type", { length: 50 }).notNull(),

    message: text("message").notNull(),

    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => ({
    incidentCreatedAtIdx: index("incident_events_incident_created_at_idx").on(
      table.incidentId,
      table.createdAt,
    ),
  }),
);

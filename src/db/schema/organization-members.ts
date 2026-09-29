import { pgTable, timestamp, uuid, unique } from "drizzle-orm/pg-core";

import { organizations } from "./organizations.js";
import { users } from "./users.js";
import { roles } from "./roles.js";

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade"
      }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade"
      }),

    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),

    createdAt: timestamp("created_at", {
      withTimezone: true
    }).defaultNow().notNull()
  },
  (table) => ({
    organizationUserUnique: unique(
      "organization_members_organization_user_unique"
    ).on(table.organizationId, table.userId)
  })
);
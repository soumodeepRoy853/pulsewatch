import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", {length: 100}).notNull().unique(),
  description: varchar("description", {length: 255}),
  createdAt: timestamp("created_at", {withTimezone: true}).defaultNow().notNull()
});
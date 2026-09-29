import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const roles = pgTable("roles", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", {length:50}).notNull().unique(),
    createdAt: timestamp("created_at", {withTimezone: true}).defaultNow().notNull()
});
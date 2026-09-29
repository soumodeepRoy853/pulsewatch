import { boolean, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable ("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", {length: 120}).notNull(),
    email: varchar("email", {length:255}).notNull().unique(),
    passwordHash: varchar("password_hash", {length:255}).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", {withTimezone: true}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {withTimezone: true}).defaultNow().notNull()
}); 
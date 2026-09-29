import {
  index,
  pgTable,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    name: varchar("name", {
      length: 120
    }).notNull(),

    slug: varchar("slug", {
      length: 100
    }).notNull()
      .unique(),

    createdAt: timestamp("created_at", {
      withTimezone: true
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true
    })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    slugIndex: index("organizations_slug_idx")
      .on(table.slug)
  })
);
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as usersSchema from "./schema/users.js";
import * as organizationsSchema from "./schema/organizations.js";
import * as rolesSchema from "./schema/roles.js";
import * as orgMembersSchema from "./schema/organization-members.js";

import { env } from "../config/env.js";

const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10
});

export const db = drizzle(queryClient, {
  schema: {
    ...usersSchema,
    ...organizationsSchema,
    ...rolesSchema,
    ...orgMembersSchema
  }
});
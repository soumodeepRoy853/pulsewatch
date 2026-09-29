import { db } from "./client.js";
import { roles } from "./schema/roles.js";
import { permissions } from "./schema/permissions.js";

const roleNames = [
  "OWNER",
  "ADMIN",
  "MEMBER",
  "VIEWER"
] as const;

const permissionDefinitions = [
  ["monitor:create", "Create monitors"],
  ["monitor:read", "View monitors"],
  ["monitor:update", "Update monitors"],
  ["monitor:delete", "Delete monitors"],

  ["incident:read", "View incidents"],
  ["incident:update", "Update incidents"],

  ["notification:manage", "Manage notification channels"],
  ["team:manage", "Manage organization members"]
] as const;

async function seed(): Promise<void> {
  await db
    .insert(roles)
    .values(
      roleNames.map((name) => ({
        name
      }))
    )
    .onConflictDoNothing();

  await db
    .insert(permissions)
    .values(
      permissionDefinitions.map(([name, description]) => ({
        name,
        description
      }))
    )
    .onConflictDoNothing();

  console.log("Database seed completed.");
}

await seed();
process.exit(0);
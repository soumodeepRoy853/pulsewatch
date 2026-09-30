import { eq, inArray } from "drizzle-orm";

import { db } from "./client.js";
import { roles } from "./schema/roles.js";
import { permissions } from "./schema/permissions.js";
import { rolePermissions } from "./schema/role-permissions.js";

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
      permissionDefinitions.map(
        ([name, description]) => ({
          name,
          description
        })
      )
    )
    .onConflictDoNothing();

  const seededRoles = await db
    .select({
      id: roles.id,
      name: roles.name
    })
    .from(roles)
    .where(inArray(roles.name, [...roleNames]));

  const seededPermissions = await db
    .select({
      id: permissions.id,
      name: permissions.name
    })
    .from(permissions)
    .where(
      inArray(
        permissions.name,
        permissionDefinitions.map(
          ([name]) => name
        )
      )
    );

  const roleMap = new Map(
    seededRoles.map((role) => [
      role.name,
      role.id
    ])
  );

  const permissionMap = new Map(
    seededPermissions.map((permission) => [
      permission.name,
      permission.id
    ])
  );

  const allPermissions =
    permissionDefinitions.map(([name]) => name);

  const adminPermissions = [
    "monitor:create",
    "monitor:read",
    "monitor:update",
    "monitor:delete",
    "incident:read",
    "incident:update",
    "notification:manage"
  ];

  const memberPermissions = [
    "monitor:read",
    "incident:read"
  ];

  const viewerPermissions = [
    "monitor:read",
    "incident:read"
  ];

  const assignments: Array<{
    roleId: string;
    permissionId: string;
  }> = [];

  function assign(
    roleName: string,
    permissionNames: readonly string[]
  ): void {
    const roleId = roleMap.get(roleName);

    if (!roleId) {
      throw new Error(
        `Role not found: ${roleName}`
      );
    }

    for (const permissionName of permissionNames) {
      const permissionId =
        permissionMap.get(permissionName);

      if (!permissionId) {
        throw new Error(
          `Permission not found: ${permissionName}`
        );
      }

      assignments.push({
        roleId,
        permissionId
      });
    }
  }

  assign("OWNER", allPermissions);
  assign("ADMIN", adminPermissions);
  assign("MEMBER", memberPermissions);
  assign("VIEWER", viewerPermissions);

  for (const assignment of assignments) {
    await db
      .insert(rolePermissions)
      .values(assignment)
      .onConflictDoNothing();
  }

  console.log(
    "Database seed completed."
  );
}

await seed();
process.exit(0);
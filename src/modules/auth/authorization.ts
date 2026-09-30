import { and, eq } from "drizzle-orm";
import type { FastifyRequest } from "fastify";

import { db } from "../../db/client.js";
import { permissions } from "../../db/schema/permissions.js";
import { rolePermissions } from "../../db/schema/role-permissions.js";

import { AppError } from "../../lib/app-error.js";

export function requirePermission(
  permissionName: string
) {
  return async (
    request: FastifyRequest
  ): Promise<void> => {
    const roleId = request.user.roleId;

    const permission =
      await db
        .select({
          id: permissions.id
        })
        .from(rolePermissions)
        .innerJoin(
          permissions,
          eq(
            rolePermissions.permissionId,
            permissions.id
          )
        )
        .where(
          and(
            eq(
              rolePermissions.roleId,
              roleId
            ),
            eq(
              permissions.name,
              permissionName
            )
          )
        )
        .limit(1);

    if (permission.length === 0) {
      throw new AppError(
        "FORBIDDEN",
        "You do not have permission to perform this action",
        403
      );
    }
  };
}
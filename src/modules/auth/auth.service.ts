import argon2 from "argon2";
import { eq, and } from "drizzle-orm";

import { db } from "../../db/client.js";
import { users } from "../../db/schema/users.js";
import { organizations } from "../../db/schema/organizations.js";
import { roles } from "../../db/schema/roles.js";
import { organizationMembers } from "../../db/schema/organization-members.js";

import { AppError } from "../../lib/app-error.js";

import type {
  LoginInput,
  RegisterInput
} from "./auth.schema.js";

export async function registerUser(
  input: RegisterInput
) {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, input.email)
  });

  if (existingUser) {
    throw new AppError(
      "USER_ALREADY_EXISTS",
      "An account with this email already exists",
      409
    );
  }

  const passwordHash = await argon2.hash(input.password);

  try {
    return await db.transaction(async (tx) => {
      const slug = createSlug(input.organizationName);

      const [organization] = await tx
        .insert(organizations)
        .values({
          name: input.organizationName,
          slug
        })
        .returning({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug
        });

      if (!organization) {
        throw new AppError(
          "ORGANIZATION_CREATION_FAILED",
          "Failed to create organization",
          500
        );
      }

      const ownerRole = await tx.query.roles.findFirst({
        where: eq(roles.name, "OWNER")
      });

      if (!ownerRole) {
        throw new AppError(
          "OWNER_ROLE_NOT_FOUND",
          "System configuration is incomplete",
          500
        );
      }

      const [user] = await tx
        .insert(users)
        .values({
          name: input.name,
          email: input.email,
          passwordHash
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email
        });

      if (!user) {
        throw new AppError(
          "USER_CREATION_FAILED",
          "Failed to create user",
          500
        );
      }

      await tx.insert(organizationMembers).values({
        organizationId: organization.id,
        userId: user.id,
        roleId: ownerRole.id
      });

      return {
        user,
        organization
      };
    });
  } catch (error) {
    if (
      isPostgresUniqueViolation(error)
    ) {
      throw new AppError(
        "RESOURCE_ALREADY_EXISTS",
        "The requested resource already exists",
        409
      );
    }

    throw error;
  }
}

export async function loginUser(
  input: LoginInput
) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email)
  });

  if (!user) {
    throw new AppError(
      "INVALID_CREDENTIALS",
      "Invalid email or password",
      401
    );
  }

  if (!user.isActive) {
    throw new AppError(
      "ACCOUNT_INACTIVE",
      "This account is inactive",
      403
    );
  }

  const passwordValid = await argon2.verify(
    user.passwordHash,
    input.password
  );

  if (!passwordValid) {
    throw new AppError(
      "INVALID_CREDENTIALS",
      "Invalid email or password",
      401
    );
  }

  const memberships = await db
    .select({
      organizationId: organizationMembers.organizationId,
      organizationName: organizations.name,
      roleId: roles.id,
      roleName: roles.name
    })
    .from(organizationMembers)
    .innerJoin(
      organizations,
      eq(
        organizationMembers.organizationId,
        organizations.id
      )
    )
    .innerJoin(
      roles,
      eq(
        organizationMembers.roleId,
        roles.id
      )
    )
    .where(
      eq(
        organizationMembers.userId,
        user.id
      )
    );

  if (memberships.length === 0) {
    throw new AppError(
      "NO_ORGANIZATION_MEMBERSHIP",
      "User does not belong to an organization",
      403
    );
  }

  let membership = memberships[0];

  if (input.organizationId) {
    const selectedMembership = memberships.find(
      (item) =>
        item.organizationId === input.organizationId
    );

    if (!selectedMembership) {
      throw new AppError(
        "ORGANIZATION_ACCESS_DENIED",
        "You do not belong to this organization",
        403
      );
    }

    membership = selectedMembership;
  } else if (memberships.length > 1) {
    throw new AppError(
      "ORGANIZATION_SELECTION_REQUIRED",
      "Organization selection is required",
      409
    );
  }

  if (!membership) {
    throw new AppError(
      "NO_ORGANIZATION_MEMBERSHIP",
      "User does not belong to an organization",
      403
    );
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    },
    organization: {
      id: membership.organizationId,
      name: membership.organizationName
    },
    role: {
      id: membership.roleId,
      name: membership.roleName
    }
  };
}

function createSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "organization";
}

function isPostgresUniqueViolation(
  error: unknown
): boolean {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return false;
  }

  return (
    "code" in error &&
    error.code === "23505"
  );
}
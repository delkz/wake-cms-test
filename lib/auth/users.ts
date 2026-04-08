import "server-only";

import type { PermissionKey, UserRole as PrismaUserRole } from "@prisma/client";

import type { AuthenticatedUser, Permission, UserRole } from "@/lib/auth/core";
import { prisma } from "@/lib/prisma";

function toRole(role: PrismaUserRole): UserRole {
  return role.toLowerCase() as UserRole;
}

function toPermission(permission: PermissionKey): Permission {
  return permission as Permission;
}

function sanitizeUser(user: {
  username: string;
  displayName: string;
  role: PrismaUserRole;
  permissionGrants: Array<{ permission: PermissionKey }>;
}): AuthenticatedUser {
  return {
    username: user.username,
    displayName: user.displayName,
    role: toRole(user.role),
    permissions: user.permissionGrants.map((grant) => toPermission(grant.permission)),
  };
}

export async function authenticateUser(username: string, password: string) {
  const normalizedUsername = username.trim().toLowerCase();

  const matchedUser = await prisma.user.findUnique({
    where: { username: normalizedUsername },
    include: {
      permissionGrants: {
        orderBy: { permission: "asc" },
      },
    },
  });

  if (!matchedUser || matchedUser.password !== password) {
    return null;
  }

  return sanitizeUser(matchedUser);
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    include: {
      permissionGrants: {
        orderBy: { permission: "asc" },
      },
    },
    orderBy: [{ role: "asc" }, { displayName: "asc" }],
  });

  return users.map(sanitizeUser);
}

export async function updateUserAccess(input: {
  username: string;
  role: PrismaUserRole;
  permissions: Permission[];
}) {
  return prisma.user.update({
    where: {
      username: input.username,
    },
    data: {
      role: input.role,
      permissionGrants: {
        deleteMany: {},
        create: input.permissions.map((permission) => ({
          permission: permission as PermissionKey,
        })),
      },
    },
    include: {
      permissionGrants: true,
    },
  });
}

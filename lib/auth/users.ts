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

type UserWithPermissions = {
  username: string;
  displayName: string;
  role: PrismaUserRole;
  isActive: boolean;
  permissionGrants: Array<{ permission: PermissionKey }>;
};

function sanitizeUser(user: UserWithPermissions): AuthenticatedUser {
  return {
    username: user.username,
    displayName: user.displayName,
    role: toRole(user.role),
    permissions: user.permissionGrants.map((grant) => toPermission(grant.permission)),
  };
}

function sanitizeUserForAdmin(user: UserWithPermissions) {
  return {
    ...sanitizeUser(user),
    isActive: user.isActive,
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

  if (!matchedUser || !matchedUser.isActive || matchedUser.password !== password) {
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
    orderBy: [{ isActive: "desc" }, { role: "asc" }, { displayName: "asc" }],
  });

  return users.map(sanitizeUserForAdmin);
}

export async function updateUserAccess(input: {
  username: string;
  displayName: string;
  role: PrismaUserRole;
  permissions: Permission[];
}) {
  return prisma.user.update({
    where: {
      username: input.username,
    },
    data: {
      displayName: input.displayName,
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

export async function updateOwnDisplayName(input: {
  username: string;
  displayName: string;
}) {
  return prisma.user.update({
    where: {
      username: input.username,
    },
    data: {
      displayName: input.displayName,
    },
    include: {
      permissionGrants: {
        orderBy: { permission: "asc" },
      },
    },
  });
}

export async function createUser(input: {
  username: string;
  password: string;
  displayName: string;
  role: PrismaUserRole;
  permissions: Permission[];
}) {
  return prisma.user.create({
    data: {
      username: input.username,
      password: input.password,
      displayName: input.displayName,
      role: input.role,
      isActive: true,
      permissionGrants: {
        create: input.permissions.map((permission) => ({
          permission: permission as PermissionKey,
        })),
      },
    },
    include: {
      permissionGrants: {
        orderBy: { permission: "asc" },
      },
    },
  });
}

export async function updateUserActiveStatus(input: {
  username: string;
  isActive: boolean;
}) {
  return prisma.user.update({
    where: {
      username: input.username,
    },
    data: {
      isActive: input.isActive,
    },
  });
}

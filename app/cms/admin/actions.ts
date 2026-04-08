"use server";

import { Prisma } from "@prisma/client";
import type { UserRole as PrismaUserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { ALL_PERMISSIONS, PERMISSIONS, type Permission } from "@/lib/auth/core";
import { createSession, requirePermission } from "@/lib/auth/session";
import { createUser, updateUserAccess, updateUserActiveStatus } from "@/lib/auth/users";

function getDisplayName(formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (displayName.length < 2) {
    throw new Error("Nome deve ter pelo menos 2 caracteres.");
  }

  if (displayName.length > 80) {
    throw new Error("Nome deve ter no maximo 80 caracteres.");
  }

  return displayName;
}

function getRole(formData: FormData) {
  const role = String(formData.get("role") ?? "").trim().toUpperCase();

  if (!["ADMIN", "PUBLISHER", "EDITOR"].includes(role)) {
    throw new Error("Perfil invalido.");
  }

  return role as PrismaUserRole;
}

function getUsername(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();

  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    throw new Error("Usuario deve ter 3-32 caracteres e usar apenas letras, numeros, ponto, traco ou underline.");
  }

  return username;
}

function getPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "").trim();

  if (password.length < 4) {
    throw new Error("Senha deve ter pelo menos 4 caracteres.");
  }

  if (password.length > 120) {
    throw new Error("Senha deve ter no maximo 120 caracteres.");
  }

  return password;
}

function getPermissions(formData: FormData) {
  const permissions = ALL_PERMISSIONS.filter((permission) => formData.has(`permission:${permission}`));

  return permissions.includes(PERMISSIONS.GLOBAL)
    ? ALL_PERMISSIONS
    : permissions;
}

function toFriendlyAdminError(error: unknown, fallbackMessage: string) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return new Error("Ja existe um usuario com esse identificador.");
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(fallbackMessage);
}

export async function saveUserAccess(formData: FormData) {
  const session = await requirePermission(PERMISSIONS.USER_MANAGE);

  const username = getUsername(formData);

  const displayName = getDisplayName(formData);
  const role = getRole(formData);
  const permissions = getPermissions(formData) as Permission[];

  await updateUserAccess({
    username,
    displayName,
    role,
    permissions,
  });

  if (username === session.username) {
    await createSession({
      ...session,
      displayName,
      role: role.toLowerCase() as "admin" | "publisher" | "editor",
      permissions,
    });
  }

  revalidatePath("/cms/admin");
  revalidatePath("/cms/me");
}

export async function createUserAccount(formData: FormData) {
  await requirePermission(PERMISSIONS.USER_MANAGE);

  try {
    await createUser({
      username: getUsername(formData),
      password: getPassword(formData),
      displayName: getDisplayName(formData),
      role: getRole(formData),
      permissions: getPermissions(formData) as Permission[],
    });
  } catch (error) {
    throw toFriendlyAdminError(error, "Nao foi possivel criar o usuario.");
  }

  revalidatePath("/cms/admin");
}

export async function deactivateUserAccount(formData: FormData) {
  const session = await requirePermission(PERMISSIONS.USER_MANAGE);
  const username = getUsername(formData);

  if (username === session.username) {
    throw new Error("Voce nao pode inativar seu proprio usuario.");
  }

  try {
    await updateUserActiveStatus({
      username,
      isActive: false,
    });
  } catch (error) {
    throw toFriendlyAdminError(error, "Nao foi possivel inativar o usuario.");
  }

  revalidatePath("/cms/admin");
}

export async function activateUserAccount(formData: FormData) {
  await requirePermission(PERMISSIONS.USER_MANAGE);

  try {
    await updateUserActiveStatus({
      username: getUsername(formData),
      isActive: true,
    });
  } catch (error) {
    throw toFriendlyAdminError(error, "Nao foi possivel reativar o usuario.");
  }

  revalidatePath("/cms/admin");
}

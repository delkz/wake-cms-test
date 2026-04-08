"use server";

import type { UserRole as PrismaUserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { ALL_PERMISSIONS, PERMISSIONS, type Permission } from "@/lib/auth/core";
import { requirePermission } from "@/lib/auth/session";
import { updateUserAccess } from "@/lib/auth/users";

function getRole(formData: FormData) {
  const role = String(formData.get("role") ?? "").trim().toUpperCase();

  if (!["ADMIN", "PUBLISHER", "EDITOR"].includes(role)) {
    throw new Error("Perfil invalido.");
  }

  return role as PrismaUserRole;
}

function getPermissions(formData: FormData) {
  const permissions = ALL_PERMISSIONS.filter((permission) => formData.has(`permission:${permission}`));

  return permissions.includes(PERMISSIONS.GLOBAL)
    ? ALL_PERMISSIONS
    : permissions;
}

export async function saveUserAccess(formData: FormData) {
  await requirePermission(PERMISSIONS.USER_MANAGE);

  const username = String(formData.get("username") ?? "").trim().toLowerCase();

  if (!username) {
    throw new Error("Usuario invalido.");
  }

  await updateUserAccess({
    username,
    role: getRole(formData),
    permissions: getPermissions(formData) as Permission[],
  });

  revalidatePath("/cms/admin");
}

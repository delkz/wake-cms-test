import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  createSessionToken,
  decodeSessionToken,
  hasPermission,
  PERMISSIONS,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  type Permission,
} from "@/lib/auth/core";
import type { AuthenticatedUser } from "@/lib/auth/core";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return decodeSessionToken(token);
}

export async function createSession(user: AuthenticatedUser) {
  const cookieStore = await cookies();
  const expires = new Date(Date.now() + SESSION_DURATION_MS);

  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requirePermission(permission: Permission) {
  const session = await requireSession();

  if (!hasPermission(session, permission)) {
    redirect("/");
  }

  return session;
}

export async function requireGlobalPermission() {
  return requirePermission(PERMISSIONS.GLOBAL);
}

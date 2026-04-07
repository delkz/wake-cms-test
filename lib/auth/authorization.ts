import { hasPermission, PERMISSIONS, type Permission } from "@/lib/auth/core";
import type { SessionPayload } from "@/lib/auth/core";

export function canCreateContent(session: SessionPayload | null | undefined) {
  return hasPermission(session, PERMISSIONS.CONTENT_CREATE);
}

export function canEditContent(session: SessionPayload | null | undefined) {
  return hasPermission(session, PERMISSIONS.CONTENT_EDIT);
}

export function canCreateBanner(session: SessionPayload | null | undefined) {
  return hasPermission(session, PERMISSIONS.BANNER_CREATE);
}

export function canCreateHotsite(session: SessionPayload | null | undefined) {
  return hasPermission(session, PERMISSIONS.HOTSITE_CREATE);
}

export function canUpdateHotsite(session: SessionPayload | null | undefined) {
  return hasPermission(session, PERMISSIONS.HOTSITE_UPDATE);
}

export function canDeleteHotsite(session: SessionPayload | null | undefined) {
  return hasPermission(session, PERMISSIONS.HOTSITE_DELETE);
}

export function canUpdateBanner(session: SessionPayload | null | undefined) {
  return hasPermission(session, PERMISSIONS.BANNER_UPDATE);
}

export function canDeleteBanner(session: SessionPayload | null | undefined) {
  return hasPermission(session, PERMISSIONS.BANNER_DELETE);
}

export function inferPermissionFromRestRequest(
  method: string,
  path: string,
): Permission | null {
  if (method === "POST" && path === "/conteudos") {
    return PERMISSIONS.CONTENT_CREATE;
  }

  if (method === "PUT" && path.startsWith("/conteudos/")) {
    return PERMISSIONS.CONTENT_EDIT;
  }

  if (method !== "GET") {
    return PERMISSIONS.GLOBAL;
  }

  return null;
}

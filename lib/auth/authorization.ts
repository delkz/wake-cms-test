import { hasPermission, PERMISSIONS, type Permission } from "@/lib/auth/core";
import type { AuthenticatedUser, SessionPayload } from "@/lib/auth/core";

type PermissionAwareSession = SessionPayload | AuthenticatedUser;

export function canCreateContent(session: PermissionAwareSession | null | undefined) {
  return hasPermission(session, PERMISSIONS.CONTENT_CREATE);
}

export function canEditContent(session: PermissionAwareSession | null | undefined) {
  return hasPermission(session, PERMISSIONS.CONTENT_EDIT);
}

export function canPublishContent(session: PermissionAwareSession | null | undefined) {
  return hasPermission(session, PERMISSIONS.CONTENT_PUBLISH);
}

export function canManageUsers(session: PermissionAwareSession | null | undefined) {
  return hasPermission(session, PERMISSIONS.USER_MANAGE);
}

export function canCreateBanner(session: PermissionAwareSession | null | undefined) {
  return hasPermission(session, PERMISSIONS.BANNER_CREATE);
}

export function canCreateHotsite(session: PermissionAwareSession | null | undefined) {
  return hasPermission(session, PERMISSIONS.HOTSITE_CREATE);
}

export function canUpdateHotsite(session: PermissionAwareSession | null | undefined) {
  return hasPermission(session, PERMISSIONS.HOTSITE_UPDATE);
}

export function canDeleteHotsite(session: PermissionAwareSession | null | undefined) {
  return hasPermission(session, PERMISSIONS.HOTSITE_DELETE);
}

export function canUpdateBanner(session: PermissionAwareSession | null | undefined) {
  return hasPermission(session, PERMISSIONS.BANNER_UPDATE);
}

export function canDeleteBanner(session: PermissionAwareSession | null | undefined) {
  return hasPermission(session, PERMISSIONS.BANNER_DELETE);
}

export function inferPermissionFromRestRequest(
  method: string,
  path: string,
): Permission | null {
  if (method === "POST" && path === "/conteudos") {
    return PERMISSIONS.CONTENT_PUBLISH;
  }

  if (method === "PUT" && path.startsWith("/conteudos/")) {
    return PERMISSIONS.CONTENT_PUBLISH;
  }

  if (method !== "GET") {
    return PERMISSIONS.GLOBAL;
  }

  return null;
}

import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "wake-cms-session";
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 8;

export const PERMISSIONS = {
  GLOBAL: "global",
  CONTENT_CREATE: "content:create",
  CONTENT_EDIT: "content:edit",
  HOTSITE_CREATE: "hotsite:create",
  HOTSITE_UPDATE: "hotsite:update",
  HOTSITE_DELETE: "hotsite:delete",
  BANNER_CREATE: "banner:create",
  BANNER_UPDATE: "banner:update",
  BANNER_DELETE: "banner:delete",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type UserRole = "admin" | "editor";

export type AuthenticatedUser = {
  username: string;
  displayName: string;
  role: UserRole;
  permissions: Permission[];
};

export type SessionPayload = AuthenticatedUser & {
  expiresAt: number;
};

function getSessionSecret() {
  return process.env.AUTH_SECRET?.trim() || "wake-cms-demo-secret";
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSessionToken(user: AuthenticatedUser) {
  const payload: SessionPayload = {
    ...user,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function decodeSessionToken(token?: string | null): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const providedSignature = Buffer.from(signature);
  const safeExpectedSignature = Buffer.from(expectedSignature);

  if (
    providedSignature.length !== safeExpectedSignature.length ||
    !timingSafeEqual(providedSignature, safeExpectedSignature)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf-8"),
    ) as SessionPayload;

    if (typeof payload.expiresAt !== "number" || payload.expiresAt <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function hasPermission(
  user: Pick<AuthenticatedUser, "permissions"> | null | undefined,
  permission: Permission,
) {
  if (!user) {
    return false;
  }

  return (
    user.permissions.includes(PERMISSIONS.GLOBAL) ||
    user.permissions.includes(permission)
  );
}

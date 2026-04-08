import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "wake-cms-session";
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 8;

export const PERMISSIONS = {
  GLOBAL: "GLOBAL",
  USER_MANAGE: "USER_MANAGE",
  CONTENT_CREATE: "CONTENT_CREATE",
  CONTENT_EDIT: "CONTENT_EDIT",
  CONTENT_PUBLISH: "CONTENT_PUBLISH",
  HOTSITE_CREATE: "HOTSITE_CREATE",
  HOTSITE_UPDATE: "HOTSITE_UPDATE",
  HOTSITE_DELETE: "HOTSITE_DELETE",
  BANNER_CREATE: "BANNER_CREATE",
  BANNER_UPDATE: "BANNER_UPDATE",
  BANNER_DELETE: "BANNER_DELETE",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type UserRole = "admin" | "publisher" | "editor";

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
  const secret = process.env.AUTH_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }

  return "wake-cms-demo-secret";
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

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export function formatPermissionLabel(permission: Permission) {
  return permission
    .toLowerCase()
    .split("_")
    .join(" ");
}

const PASSWORD_HASH_ALGORITHM = "pbkdf2";
const PASSWORD_HASH_DIGEST = "sha256";
const PASSWORD_HASH_ITERATIONS = 210000;
const PASSWORD_HASH_KEY_LENGTH = 32;

function buildPasswordHash(salt: string, password: string) {
  return pbkdf2Sync(password, salt, PASSWORD_HASH_ITERATIONS, PASSWORD_HASH_KEY_LENGTH, PASSWORD_HASH_DIGEST).toString("base64url");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = buildPasswordHash(salt, password);

  return `${PASSWORD_HASH_ALGORITHM}$${PASSWORD_HASH_DIGEST}$${PASSWORD_HASH_ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(storedPassword: string, password: string) {
  const parts = storedPassword.split("$");

  if (parts.length !== 5) {
    return storedPassword === password;
  }

  const [algorithm, digest, iterationsText, salt, expectedHash] = parts;

  if (algorithm !== PASSWORD_HASH_ALGORITHM || digest !== PASSWORD_HASH_DIGEST) {
    return false;
  }

  const iterations = Number(iterationsText);

  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }

  const actualHash = pbkdf2Sync(password, salt, iterations, PASSWORD_HASH_KEY_LENGTH, digest).toString("base64url");
  const providedHash = Buffer.from(actualHash);
  const safeExpectedHash = Buffer.from(expectedHash);

  if (providedHash.length !== safeExpectedHash.length) {
    return false;
  }

  return timingSafeEqual(providedHash, safeExpectedHash);
}

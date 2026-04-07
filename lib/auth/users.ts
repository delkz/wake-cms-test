import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import type { AuthenticatedUser, Permission, UserRole } from "@/lib/auth/core";

type StoredUser = {
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
  permissions: Permission[];
};

const USERS_FILE_PATH = path.join(process.cwd(), "data", "users.json");

async function readUsersFile() {
  const rawUsers = await readFile(USERS_FILE_PATH, "utf-8");
  return JSON.parse(rawUsers) as StoredUser[];
}

function sanitizeUser(user: StoredUser): AuthenticatedUser {
  return {
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    permissions: user.permissions,
  };
}

export async function authenticateUser(username: string, password: string) {
  const users = await readUsersFile();
  const normalizedUsername = username.trim().toLowerCase();

  const matchedUser = users.find(
    (user) =>
      user.username.trim().toLowerCase() === normalizedUsername &&
      user.password === password,
  );

  if (!matchedUser) {
    return null;
  }

  return sanitizeUser(matchedUser);
}

export async function listUsers() {
  const users = await readUsersFile();
  return users.map(sanitizeUser);
}

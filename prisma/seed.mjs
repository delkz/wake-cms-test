import { PermissionKey, PrismaClient, UserRole } from "@prisma/client";
import { pbkdf2Sync, randomBytes } from "node:crypto";

const prisma = new PrismaClient();

const PASSWORD_HASH_ALGORITHM = "pbkdf2";
const PASSWORD_HASH_DIGEST = "sha256";
const PASSWORD_HASH_ITERATIONS = 210000;
const PASSWORD_HASH_KEY_LENGTH = 32;

function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(password, salt, PASSWORD_HASH_ITERATIONS, PASSWORD_HASH_KEY_LENGTH, PASSWORD_HASH_DIGEST).toString("base64url");

  return `${PASSWORD_HASH_ALGORITHM}$${PASSWORD_HASH_DIGEST}$${PASSWORD_HASH_ITERATIONS}$${salt}$${hash}`;
}

const users = [
  {
    username: "admin",
    password: "admin",
    displayName: "Administrador",
    role: UserRole.ADMIN,
    permissions: Object.values(PermissionKey),
  },
  {
    username: "publisher",
    password: "publisher",
    displayName: "Publicador",
    role: UserRole.PUBLISHER,
    permissions: [
      PermissionKey.CONTENT_CREATE,
      PermissionKey.CONTENT_EDIT,
      PermissionKey.CONTENT_PUBLISH,
      PermissionKey.HOTSITE_CREATE,
      PermissionKey.HOTSITE_UPDATE,
      PermissionKey.BANNER_CREATE,
      PermissionKey.BANNER_UPDATE,
    ],
  },
  {
    username: "editor",
    password: "editor",
    displayName: "Editor de Conteudo",
    role: UserRole.EDITOR,
    permissions: [PermissionKey.CONTENT_CREATE, PermissionKey.CONTENT_EDIT],
  },
];

async function upsertUser({ permissions, ...user }) {
  await prisma.user.upsert({
    where: { username: user.username },
    update: {
      displayName: user.displayName,
      password: hashPassword(user.password),
      role: user.role,
      permissionGrants: {
        deleteMany: {},
        create: permissions.map((permission) => ({ permission })),
      },
    },
    create: {
      ...user,
      password: hashPassword(user.password),
      permissionGrants: {
        create: permissions.map((permission) => ({ permission })),
      },
    },
  });
}

async function main() {
  for (const user of users) {
    await upsertUser(user);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

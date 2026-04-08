import { PermissionKey, PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

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
      password: user.password,
      role: user.role,
      permissionGrants: {
        deleteMany: {},
        create: permissions.map((permission) => ({ permission })),
      },
    },
    create: {
      ...user,
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

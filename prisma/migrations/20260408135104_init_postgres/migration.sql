-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PUBLISHER', 'EDITOR');

-- CreateEnum
CREATE TYPE "PermissionKey" AS ENUM ('GLOBAL', 'USER_MANAGE', 'CONTENT_CREATE', 'CONTENT_EDIT', 'CONTENT_PUBLISH', 'HOTSITE_CREATE', 'HOTSITE_UPDATE', 'HOTSITE_DELETE', 'BANNER_CREATE', 'BANNER_UPDATE', 'BANNER_DELETE');

-- CreateEnum
CREATE TYPE "WorkflowEntityType" AS ENUM ('CONTENT', 'PAGE');

-- CreateEnum
CREATE TYPE "WorkflowAction" AS ENUM ('CREATE', 'UPDATE');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('PENDING_REVIEW', 'REJECTED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "PermissionKey" NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowItem" (
    "id" TEXT NOT NULL,
    "entityType" "WorkflowEntityType" NOT NULL,
    "action" "WorkflowAction" NOT NULL,
    "status" "WorkflowStatus" NOT NULL,
    "targetEntityId" TEXT,
    "wakeEntityId" TEXT,
    "title" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "publishedById" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permission_key" ON "UserPermission"("userId", "permission");

-- CreateIndex
CREATE INDEX "WorkflowItem_entityType_status_idx" ON "WorkflowItem"("entityType", "status");

-- CreateIndex
CREATE INDEX "WorkflowItem_targetEntityId_status_idx" ON "WorkflowItem"("targetEntityId", "status");

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowItem" ADD CONSTRAINT "WorkflowItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowItem" ADD CONSTRAINT "WorkflowItem_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowItem" ADD CONSTRAINT "WorkflowItem_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

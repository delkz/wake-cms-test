import "server-only";

import { Prisma, WorkflowAction, WorkflowEntityType, WorkflowStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";

import { uploadBannerImage, updateBanner, type UploadBannerOptions } from "@/app/lib/cms/banners-api";
import { canPublishContent } from "@/lib/auth/authorization";
import type { AuthenticatedUser } from "@/lib/auth/core";
import { prisma } from "@/lib/prisma";

const WORKFLOW_ENTITY_BANNER = "BANNER" as unknown as WorkflowEntityType;

const WORKFLOW_HISTORY_EVENT_TYPES = {
  SAVED_FOR_REVIEW: "SAVED_FOR_REVIEW",
  UPDATED_REVIEW: "UPDATED_REVIEW",
  REJECTED: "REJECTED",
  PUBLISHED: "PUBLISHED",
} as const;

type WorkflowHistoryEventTypeValue =
  (typeof WORKFLOW_HISTORY_EVENT_TYPES)[keyof typeof WORKFLOW_HISTORY_EVENT_TYPES];

type WorkflowItemWithUsers = Prisma.WorkflowItemGetPayload<{
  include: {
    requestedBy: {
      select: {
        username: true;
        displayName: true;
      };
    };
    publishedBy: {
      select: {
        username: true;
        displayName: true;
      };
    };
  };
}>;

export type WorkflowBannerRecord = WorkflowItemWithUsers & {
  banner: UploadBannerOptions;
};

function serializeBannerPayload(payload: UploadBannerOptions) {
  return JSON.stringify(payload);
}

function parseBannerPayload(payload: string) {
  return JSON.parse(payload) as UploadBannerOptions;
}

function inferWorkflowAction(banner: UploadBannerOptions) {
  return banner.id ? WorkflowAction.UPDATE : WorkflowAction.CREATE;
}

async function createWorkflowHistoryEntry(input: {
  workflowItemId?: string | null;
  actorId: string;
  entityType: WorkflowEntityType;
  action: WorkflowAction;
  status: WorkflowStatus;
  eventType: WorkflowHistoryEventTypeValue;
  targetEntityId?: string | null;
  wakeEntityId?: string | null;
  title: string;
  payload: string;
}) {
  await prisma.$executeRaw`
    INSERT INTO "WorkflowItemHistory" (
      "id",
      "workflowItemId",
      "entityType",
      "action",
      "status",
      "eventType",
      "targetEntityId",
      "wakeEntityId",
      "title",
      "payload",
      "actorId",
      "retentionUntil"
    ) VALUES (
      ${randomUUID()},
      ${input.workflowItemId ?? null},
      ${input.entityType}::"WorkflowEntityType",
      ${input.action}::"WorkflowAction",
      ${input.status}::"WorkflowStatus",
      ${input.eventType}::"WorkflowHistoryEventType",
      ${input.targetEntityId ?? null},
      ${input.wakeEntityId ?? null},
      ${input.title},
      ${input.payload},
      ${input.actorId},
      ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
    )
  `;
}

async function findActor(username: string) {
  const actor = await prisma.user.findUnique({
    where: { username },
  });

  if (!actor) {
    throw new Error("Usuario autenticado nao encontrado no banco.");
  }

  return actor;
}

async function publishBannerPayload(payload: UploadBannerOptions) {
  if (payload.id) {
    await updateBanner(String(payload.id), payload);
    return String(payload.id);
  }

  await uploadBannerImage(payload);
  return null;
}

async function findExistingPendingItem(targetEntityId?: string | null) {
  if (!targetEntityId) {
    return null;
  }

  return prisma.workflowItem.findFirst({
    where: {
      entityType: WORKFLOW_ENTITY_BANNER,
      status: WorkflowStatus.PENDING_REVIEW,
      targetEntityId,
    },
  });
}

async function findExistingWorkflowReview(workflowId?: string) {
  if (!workflowId) {
    return null;
  }

  return prisma.workflowItem.findFirst({
    where: {
      id: workflowId,
      entityType: WORKFLOW_ENTITY_BANNER,
      status: {
        in: [WorkflowStatus.PENDING_REVIEW, WorkflowStatus.REJECTED],
      },
    },
  });
}

export async function submitBannerWorkflow(
  banner: UploadBannerOptions,
  session: AuthenticatedUser,
  publishDirectly = false,
) {
  const actor = await findActor(session.username);
  const shouldPublish = publishDirectly && canPublishContent(session);
  const wakeBannerId = shouldPublish ? await publishBannerPayload(banner) : null;
  const existingWorkflowReview = await findExistingWorkflowReview(String(banner.id ?? ""));
  const existingPendingItem = !shouldPublish
    ? (existingWorkflowReview ?? (await findExistingPendingItem(banner.id ? String(banner.id) : null)))
    : existingWorkflowReview;

  const workflowData = {
    entityType: WORKFLOW_ENTITY_BANNER,
    action: inferWorkflowAction(banner),
    status: shouldPublish ? WorkflowStatus.PUBLISHED : WorkflowStatus.PENDING_REVIEW,
    targetEntityId: banner.id ? String(banner.id) : null,
    wakeEntityId: wakeBannerId,
    title: banner.nome || "Banner sem nome",
    payload: serializeBannerPayload({
      ...banner,
      id: banner.id,
    }),
    createdById: actor.id,
    requestedById: actor.id,
    publishedById: shouldPublish ? actor.id : null,
    publishedAt: shouldPublish ? new Date() : null,
  };

  const workflowItem = existingPendingItem
    ? await prisma.workflowItem.update({
        where: {
          id: existingPendingItem.id,
        },
        data: {
          action: workflowData.action,
          status: workflowData.status,
          targetEntityId: workflowData.targetEntityId,
          wakeEntityId: workflowData.wakeEntityId,
          title: workflowData.title,
          payload: workflowData.payload,
          requestedById: workflowData.requestedById,
          publishedById: workflowData.publishedById,
          publishedAt: workflowData.publishedAt,
          requestedAt: new Date(),
        },
      })
    : await prisma.workflowItem.create({
        data: workflowData,
      });

  await createWorkflowHistoryEntry({
    workflowItemId: workflowItem.id,
    actorId: actor.id,
    entityType: workflowItem.entityType,
    action: workflowItem.action,
    status: workflowItem.status,
    eventType: shouldPublish
      ? WORKFLOW_HISTORY_EVENT_TYPES.PUBLISHED
      : existingPendingItem
        ? WORKFLOW_HISTORY_EVENT_TYPES.UPDATED_REVIEW
        : WORKFLOW_HISTORY_EVENT_TYPES.SAVED_FOR_REVIEW,
    targetEntityId: workflowItem.targetEntityId,
    wakeEntityId: workflowItem.wakeEntityId,
    title: workflowItem.title,
    payload: workflowItem.payload,
  });

  return {
    mode: shouldPublish ? "published" : "pending",
    workflowId: workflowItem.id,
    wakeBannerId: wakeBannerId ?? (banner.id ? String(banner.id) : null),
  };
}

function mapWorkflowItem(item: WorkflowItemWithUsers): WorkflowBannerRecord {
  return {
    ...item,
    banner: parseBannerPayload(item.payload),
  };
}

export async function getBannerWorkflowItemForPublishing(workflowId: string): Promise<WorkflowBannerRecord> {
  const item = await prisma.workflowItem.findUnique({
    where: {
      id: workflowId,
    },
    include: {
      requestedBy: {
        select: {
          username: true,
          displayName: true,
        },
      },
      publishedBy: {
        select: {
          username: true,
          displayName: true,
        },
      },
    },
  });

  if (!item || item.entityType !== WORKFLOW_ENTITY_BANNER) {
    throw new Error("Solicitacao de aprovacao de banner nao encontrada.");
  }

  return mapWorkflowItem(item);
}

export async function publishBannerWorkflowItem(workflowId: string, session: AuthenticatedUser) {
  const actor = await findActor(session.username);
  const workflowItem = await getBannerWorkflowItemForPublishing(workflowId);

  if (workflowItem.status !== WorkflowStatus.PENDING_REVIEW) {
    throw new Error("Esta solicitacao nao esta mais pendente.");
  }

  const wakeBannerId = await publishBannerPayload(workflowItem.banner);

  const updatedWorkflowItem = await prisma.workflowItem.update({
    where: {
      id: workflowId,
    },
    data: {
      status: WorkflowStatus.PUBLISHED,
      wakeEntityId: wakeBannerId,
      targetEntityId: wakeBannerId ?? workflowItem.targetEntityId,
      payload: serializeBannerPayload({
        ...workflowItem.banner,
        id: workflowItem.banner.id,
      }),
      publishedById: actor.id,
      publishedAt: new Date(),
    },
  });

  await createWorkflowHistoryEntry({
    workflowItemId: updatedWorkflowItem.id,
    actorId: actor.id,
    entityType: updatedWorkflowItem.entityType,
    action: updatedWorkflowItem.action,
    status: updatedWorkflowItem.status,
    eventType: WORKFLOW_HISTORY_EVENT_TYPES.PUBLISHED,
    targetEntityId: updatedWorkflowItem.targetEntityId,
    wakeEntityId: updatedWorkflowItem.wakeEntityId,
    title: updatedWorkflowItem.title,
    payload: updatedWorkflowItem.payload,
  });

  return {
    wakeBannerId,
  };
}

export async function rejectBannerWorkflowItem(workflowId: string, session: AuthenticatedUser) {
  const actor = await findActor(session.username);
  const workflowItem = await getBannerWorkflowItemForPublishing(workflowId);

  if (workflowItem.status !== WorkflowStatus.PENDING_REVIEW) {
    throw new Error("Esta solicitacao nao esta mais pendente.");
  }

  const updatedWorkflowItem = await prisma.workflowItem.update({
    where: {
      id: workflowId,
    },
    data: {
      status: WorkflowStatus.REJECTED,
      publishedById: null,
      publishedAt: null,
    },
  });

  await createWorkflowHistoryEntry({
    workflowItemId: updatedWorkflowItem.id,
    actorId: actor.id,
    entityType: updatedWorkflowItem.entityType,
    action: updatedWorkflowItem.action,
    status: updatedWorkflowItem.status,
    eventType: WORKFLOW_HISTORY_EVENT_TYPES.REJECTED,
    targetEntityId: updatedWorkflowItem.targetEntityId,
    wakeEntityId: updatedWorkflowItem.wakeEntityId,
    title: updatedWorkflowItem.title,
    payload: updatedWorkflowItem.payload,
  });

  return { workflowId };
}
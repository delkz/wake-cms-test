import "server-only";

import {
  Prisma,
  WorkflowAction,
  WorkflowEntityType,
  WorkflowStatus,
} from "@prisma/client";
import { randomUUID } from "node:crypto";

import { cmsApi } from "@/app/lib/cms-api";
import type { Hotsite } from "@/app/lib/cms/types";
import { canPublishContent } from "@/lib/auth/authorization";
import type { AuthenticatedUser } from "@/lib/auth/core";
import { prisma } from "@/lib/prisma";

const WORKFLOW_ENTITY_HOTSITE = "HOTSITE" as unknown as WorkflowEntityType;

const WORKFLOW_HISTORY_EVENT_TYPES = {
  SAVED_FOR_REVIEW: "SAVED_FOR_REVIEW",
  UPDATED_REVIEW: "UPDATED_REVIEW",
  REJECTED: "REJECTED",
  PUBLISHED: "PUBLISHED",
} as const;

type WorkflowHistoryEventTypeValue =
  (typeof WORKFLOW_HISTORY_EVENT_TYPES)[keyof typeof WORKFLOW_HISTORY_EVENT_TYPES];

type WorkflowHotsiteItemWithUsers = Prisma.WorkflowItemGetPayload<{
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

export type WorkflowHotsiteRecord = WorkflowHotsiteItemWithUsers & {
  hotsite: Hotsite;
};

function serializeHotsitePayload(payload: Hotsite) {
  return JSON.stringify(payload);
}

function parseHotsitePayload(payload: string) {
  return JSON.parse(payload) as Hotsite;
}

function inferWorkflowAction(hotsite: Hotsite) {
  return hotsite.hotsiteId ? WorkflowAction.UPDATE : WorkflowAction.CREATE;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
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
      ${addDays(new Date(), 30)}
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

async function publishHotsitePayload(payload: Hotsite) {
  await cmsApi.updateHotsite(payload);
  return payload.hotsiteId;
}

async function findExistingPendingItem(targetEntityId?: string) {
  if (!targetEntityId) {
    return null;
  }

  return prisma.workflowItem.findFirst({
    where: {
      entityType: WORKFLOW_ENTITY_HOTSITE,
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
      entityType: WORKFLOW_ENTITY_HOTSITE,
      status: {
        in: [WorkflowStatus.PENDING_REVIEW, WorkflowStatus.REJECTED],
      },
    },
  });
}

export async function submitHotsiteWorkflow(
  hotsite: Hotsite,
  session: AuthenticatedUser,
  publishDirectly = false,
) {
  const actor = await findActor(session.username);
  const userCanPublish = canPublishContent(session);
  const shouldPublish = publishDirectly && userCanPublish;
  const existingWorkflowReview = await findExistingWorkflowReview(hotsite.workflowId);
  const existingPendingItem = !shouldPublish
    ? (existingWorkflowReview ?? (await findExistingPendingItem(hotsite.hotsiteId)))
    : existingWorkflowReview;

  const wakeHotsiteId = shouldPublish ? await publishHotsitePayload(hotsite) : null;
  const workflowData = {
    entityType: WORKFLOW_ENTITY_HOTSITE,
    action: inferWorkflowAction(hotsite),
    status: shouldPublish ? WorkflowStatus.PUBLISHED : WorkflowStatus.PENDING_REVIEW,
    targetEntityId: hotsite.hotsiteId || null,
    wakeEntityId: wakeHotsiteId || null,
    title: hotsite.nome || "Hotsite sem nome",
    payload: serializeHotsitePayload(hotsite),
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
    wakeHotsiteId: wakeHotsiteId ?? hotsite.hotsiteId,
  };
}

export async function getHotsiteWorkflowItemForPublishing(
  workflowId: string,
): Promise<WorkflowHotsiteRecord> {
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

  if (!item || item.entityType !== WORKFLOW_ENTITY_HOTSITE) {
    throw new Error("Solicitacao de aprovacao de hotsite nao encontrada.");
  }

  return {
    ...item,
    hotsite: parseHotsitePayload(item.payload),
  };
}

export async function publishHotsiteWorkflowItem(workflowId: string, session: AuthenticatedUser) {
  const actor = await findActor(session.username);
  const workflowItem = await getHotsiteWorkflowItemForPublishing(workflowId);

  if (workflowItem.status !== WorkflowStatus.PENDING_REVIEW) {
    throw new Error("Esta solicitacao de hotsite nao esta mais pendente.");
  }

  const wakeHotsiteId = await publishHotsitePayload(workflowItem.hotsite);

  const updatedWorkflowItem = await prisma.workflowItem.update({
    where: {
      id: workflowId,
    },
    data: {
      status: WorkflowStatus.PUBLISHED,
      wakeEntityId: wakeHotsiteId,
      targetEntityId: wakeHotsiteId,
      payload: serializeHotsitePayload({
        ...workflowItem.hotsite,
        hotsiteId: wakeHotsiteId,
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
    wakeHotsiteId,
  };
}

export async function rejectHotsiteWorkflowItem(workflowId: string, session: AuthenticatedUser) {
  const actor = await findActor(session.username);
  const workflowItem = await getHotsiteWorkflowItemForPublishing(workflowId);

  if (workflowItem.status !== WorkflowStatus.PENDING_REVIEW) {
    throw new Error("Esta solicitacao de hotsite nao esta mais pendente.");
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

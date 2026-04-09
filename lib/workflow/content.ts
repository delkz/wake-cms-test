import "server-only";

import { unstable_cache } from "next/cache";
import {
  Prisma,
  WorkflowAction,
  WorkflowEntityType,
  WorkflowStatus,
} from "@prisma/client";
import { randomUUID } from "node:crypto";

import { cmsApi } from "@/app/lib/cms-api";
import type { HotsiteContent } from "@/app/lib/cms/types";
import { PERMISSIONS, hasPermission, type AuthenticatedUser } from "@/lib/auth/core";
import { canPublishContent } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";

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

type WorkflowContentRecord = WorkflowItemWithUsers & {
  content: HotsiteContent;
};

type WorkflowHistoryLogRecord = {
  id: string;
  workflowItemId: string | null;
  entityType: WorkflowEntityType;
  title: string;
  eventType: WorkflowHistoryEventTypeValue;
  status: WorkflowStatus;
  action: WorkflowAction;
  targetEntityId: string | null;
  createdAt: Date;
  actorUsername: string;
  actorDisplayName: string;
};

const WORKFLOW_HISTORY_EVENT_TYPES = {
  SAVED_FOR_REVIEW: "SAVED_FOR_REVIEW",
  UPDATED_REVIEW: "UPDATED_REVIEW",
  REJECTED: "REJECTED",
  PUBLISHED: "PUBLISHED",
} as const;

const DEFAULT_RECENT_HISTORY_LIMIT = 12;
const MAX_RECENT_HISTORY_LIMIT = 100;

type WorkflowHistoryEventTypeValue =
  (typeof WORKFLOW_HISTORY_EVENT_TYPES)[keyof typeof WORKFLOW_HISTORY_EVENT_TYPES];

function serializeContentPayload(payload: HotsiteContent) {
  return JSON.stringify(payload);
}

function parseContentPayload(payload: string) {
  return JSON.parse(payload) as HotsiteContent;
}

function inferWorkflowAction(content: HotsiteContent) {
  return content.contentId ? WorkflowAction.UPDATE : WorkflowAction.CREATE;
}

function extractWakeContentId(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (value && typeof value === "object") {
    const candidate =
      ("contentId" in value && value.contentId) ||
      ("conteudoId" in value && value.conteudoId) ||
      ("id" in value && value.id);

    if (typeof candidate === "string" || typeof candidate === "number") {
      return String(candidate);
    }
  }

  throw new Error("A Wake API nao retornou o identificador do conteudo publicado.");
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

async function publishContentPayload(payload: HotsiteContent) {
  if (payload.contentId) {
    await cmsApi.updateContent(payload);
    return payload.contentId;
  }

  const created = await cmsApi.createContent(payload);
  return extractWakeContentId(created);
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

async function findExistingPendingItem(targetEntityId?: string) {
  if (!targetEntityId) {
    return null;
  }

  return prisma.workflowItem.findFirst({
    where: {
      entityType: WorkflowEntityType.CONTENT,
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
      entityType: WorkflowEntityType.CONTENT,
      status: {
        in: [WorkflowStatus.PENDING_REVIEW, WorkflowStatus.REJECTED],
      },
    },
  });
}

export async function submitContentWorkflow(
  content: HotsiteContent,
  session: AuthenticatedUser,
  publishDirectly = false,
) {
  const actor = await findActor(session.username);
  const userCanPublish = canPublishContent(session);
  const shouldPublish = publishDirectly && userCanPublish;
  const wakeContentId = shouldPublish ? await publishContentPayload(content) : null;
  const existingWorkflowReview = await findExistingWorkflowReview(content.workflowId);
  const existingPendingItem = !shouldPublish
    ? (existingWorkflowReview ?? (await findExistingPendingItem(content.contentId)))
    : existingWorkflowReview;

  const workflowData = {
    entityType: WorkflowEntityType.CONTENT,
    action: inferWorkflowAction(content),
    status: shouldPublish ? WorkflowStatus.PUBLISHED : WorkflowStatus.PENDING_REVIEW,
    targetEntityId: content.contentId || null,
    wakeEntityId: wakeContentId,
    title: content.title || "Conteudo sem titulo",
    payload: serializeContentPayload({
      ...content,
      contentId: wakeContentId ?? content.contentId,
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
    wakeContentId: wakeContentId ?? content.contentId ?? null,
  };
}

function mapWorkflowItem(item: WorkflowItemWithUsers): WorkflowContentRecord {
  return {
    ...item,
    content: parseContentPayload(item.payload),
  };
}

export async function listWorkflowItemsForReview() {
  const items = await prisma.workflowItem.findMany({
    where: {
      entityType: WorkflowEntityType.CONTENT,
      status: WorkflowStatus.PENDING_REVIEW,
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
    orderBy: [{ requestedAt: "asc" }],
  });

  return items.map(mapWorkflowItem);
}

export async function listWorkflowItemsForUser(username: string) {
  const items = await prisma.workflowItem.findMany({
    where: {
      entityType: WorkflowEntityType.CONTENT,
      requestedBy: {
        username,
      },
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
    orderBy: [{ updatedAt: "desc" }],
  });

  return items.map(mapWorkflowItem);
}

export async function getWorkflowItemForPublishing(workflowId: string): Promise<WorkflowContentRecord> {
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

  if (!item || item.entityType !== WorkflowEntityType.CONTENT) {
    throw new Error("Solicitacao de aprovacao nao encontrada.");
  }

  return {
    ...item,
    content: parseContentPayload(item.payload),
  };
}

export async function getWorkflowItemForPreview(workflowId: string, session: AuthenticatedUser) {
  const item = await getWorkflowItemForPublishing(workflowId);

  if (
    item.requestedBy.username !== session.username &&
    !hasPermission(session, PERMISSIONS.CONTENT_PUBLISH) &&
    !hasPermission(session, PERMISSIONS.USER_MANAGE)
  ) {
    throw new Error("Voce nao tem permissao para visualizar este preview.");
  }

  return item;
}

export async function publishWorkflowItem(workflowId: string, session: AuthenticatedUser) {
  const actor = await findActor(session.username);
  const workflowItem = await getWorkflowItemForPublishing(workflowId);

  if (workflowItem.status !== WorkflowStatus.PENDING_REVIEW) {
    throw new Error("Esta solicitacao nao esta mais pendente.");
  }

  const wakeContentId = await publishContentPayload(workflowItem.content);

  const updatedWorkflowItem = await prisma.workflowItem.update({
    where: {
      id: workflowId,
    },
    data: {
      status: WorkflowStatus.PUBLISHED,
      wakeEntityId: wakeContentId,
      targetEntityId: wakeContentId,
      payload: serializeContentPayload({
        ...workflowItem.content,
        contentId: wakeContentId,
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
    wakeContentId,
  };
}

export async function rejectWorkflowItem(workflowId: string, session: AuthenticatedUser) {
  const actor = await findActor(session.username);
  const workflowItem = await getWorkflowItemForPublishing(workflowId);

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

function normalizeRecentHistoryLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return DEFAULT_RECENT_HISTORY_LIMIT;
  }

  const normalized = Math.trunc(limit);
  if (normalized < 1) {
    return 1;
  }

  return Math.min(normalized, MAX_RECENT_HISTORY_LIMIT);
}

const listRecentWorkflowHistoryCached = unstable_cache(
  async (limit: number): Promise<WorkflowHistoryLogRecord[]> => {
  const rows = await prisma.$queryRaw<WorkflowHistoryLogRecord[]>`
    SELECT
      history."id" as "id",
      history."workflowItemId" as "workflowItemId",
      history."entityType" as "entityType",
      history."title" as "title",
      history."eventType" as "eventType",
      history."status" as "status",
      history."action" as "action",
      history."targetEntityId" as "targetEntityId",
      history."createdAt" as "createdAt",
      users."username" as "actorUsername",
      users."displayName" as "actorDisplayName"
    FROM "WorkflowItemHistory" history
    INNER JOIN "User" users
      ON users."id" = history."actorId"
    WHERE history."entityType" IN ('CONTENT'::"WorkflowEntityType", 'HOTSITE'::"WorkflowEntityType", 'BANNER'::"WorkflowEntityType")
    ORDER BY history."createdAt" DESC
    LIMIT ${limit}
  `;

    return rows;
  },
  ["workflow-recent-history"],
  {
    revalidate: 30,
    tags: ["workflow-history"],
  },
);

export async function listRecentWorkflowHistory(
  limit = DEFAULT_RECENT_HISTORY_LIMIT,
): Promise<WorkflowHistoryLogRecord[]> {
  return listRecentWorkflowHistoryCached(normalizeRecentHistoryLimit(limit));
}

import "server-only";

import { Prisma, WorkflowEntityType, WorkflowStatus } from "@prisma/client";

import type { Hotsite } from "@/app/lib/cms/types";
import type { HotsiteContent } from "@/app/lib/cms/types";
import { hasPermission, PERMISSIONS, type AuthenticatedUser } from "@/lib/auth/core";
import { prisma } from "@/lib/prisma";
import { publishWorkflowItem, rejectWorkflowItem } from "@/lib/workflow/content";
import { publishHotsiteWorkflowItem, rejectHotsiteWorkflowItem } from "@/lib/workflow/hotsite";

const WORKFLOW_ENTITY_HOTSITE = "HOTSITE" as unknown as WorkflowEntityType;

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

export type ApprovalWorkflowEntity = "CONTENT" | "HOTSITE";

type ApprovalWorkflowItemBase = Omit<
  WorkflowItemWithUsers,
  "entityType" | "payload"
>;

type ContentApprovalWorkflowItem = ApprovalWorkflowItemBase & {
  entityType: "CONTENT";
  content: HotsiteContent;
  hotsite: null;
};

type HotsiteApprovalWorkflowItem = ApprovalWorkflowItemBase & {
  entityType: "HOTSITE";
  content: null;
  hotsite: Hotsite;
};

export type ApprovalWorkflowItem =
  | ContentApprovalWorkflowItem
  | HotsiteApprovalWorkflowItem;

function parsePayload(item: WorkflowItemWithUsers): ApprovalWorkflowItem {
  const base: ApprovalWorkflowItemBase = {
    id: item.id,
    action: item.action,
    status: item.status,
    targetEntityId: item.targetEntityId,
    wakeEntityId: item.wakeEntityId,
    title: item.title,
    createdById: item.createdById,
    requestedById: item.requestedById,
    publishedById: item.publishedById,
    requestedAt: item.requestedAt,
    publishedAt: item.publishedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    requestedBy: item.requestedBy,
    publishedBy: item.publishedBy,
  };

  if (item.entityType === WorkflowEntityType.CONTENT) {
    return {
      ...base,
      entityType: "CONTENT",
      content: JSON.parse(item.payload) as HotsiteContent,
      hotsite: null,
    };
  }

  if (item.entityType === WORKFLOW_ENTITY_HOTSITE) {
    return {
      ...base,
      entityType: "HOTSITE",
      content: null,
      hotsite: JSON.parse(item.payload) as Hotsite,
    };
  }

  throw new Error("Tipo de entidade de workflow nao suportado.");
}

export async function listApprovalItemsForReview() {
  const items = await prisma.workflowItem.findMany({
    where: {
      entityType: {
        in: [WorkflowEntityType.CONTENT, WORKFLOW_ENTITY_HOTSITE],
      },
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

  return items.map(parsePayload);
}

export async function listApprovalItemsForUser(username: string) {
  const items = await prisma.workflowItem.findMany({
    where: {
      entityType: {
        in: [WorkflowEntityType.CONTENT, WORKFLOW_ENTITY_HOTSITE],
      },
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

  return items.map(parsePayload);
}

export async function getApprovalItemForPreview(workflowId: string, session: AuthenticatedUser) {
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

  if (!item || (item.entityType !== WorkflowEntityType.CONTENT && item.entityType !== WORKFLOW_ENTITY_HOTSITE)) {
    throw new Error("Solicitacao de aprovacao nao encontrada.");
  }

  if (
    item.requestedBy.username !== session.username &&
    !hasPermission(session, PERMISSIONS.CONTENT_PUBLISH) &&
    !hasPermission(session, PERMISSIONS.USER_MANAGE)
  ) {
    throw new Error("Voce nao tem permissao para visualizar este preview.");
  }

  return parsePayload(item);
}

export async function publishApprovalWorkflowItem(workflowId: string, session: AuthenticatedUser) {
  const item = await prisma.workflowItem.findUnique({
    where: {
      id: workflowId,
    },
    select: {
      entityType: true,
    },
  });

  if (!item) {
    throw new Error("Solicitacao de aprovacao nao encontrada.");
  }

  if (item.entityType === WorkflowEntityType.CONTENT) {
    const result = await publishWorkflowItem(workflowId, session);
    return {
      entityType: "CONTENT" as const,
      wakeEntityId: result.wakeContentId,
    };
  }

  if (item.entityType === WORKFLOW_ENTITY_HOTSITE) {
    const result = await publishHotsiteWorkflowItem(workflowId, session);
    return {
      entityType: "HOTSITE" as const,
      wakeEntityId: result.wakeHotsiteId,
    };
  }

  throw new Error("Tipo de entidade de workflow nao suportado para publicacao.");
}

export async function rejectApprovalWorkflowItem(workflowId: string, session: AuthenticatedUser) {
  const item = await prisma.workflowItem.findUnique({
    where: {
      id: workflowId,
    },
    select: {
      entityType: true,
    },
  });

  if (!item) {
    throw new Error("Solicitacao de aprovacao nao encontrada.");
  }

  if (item.entityType === WorkflowEntityType.CONTENT) {
    return rejectWorkflowItem(workflowId, session);
  }

  if (item.entityType === WORKFLOW_ENTITY_HOTSITE) {
    return rejectHotsiteWorkflowItem(workflowId, session);
  }

  throw new Error("Tipo de entidade de workflow nao suportado para reprovacao.");
}

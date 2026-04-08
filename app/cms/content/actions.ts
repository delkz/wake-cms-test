"use server";

import { revalidatePath } from "next/cache";

import type { HotsiteContent } from "@/app/lib/cms/types";
import { PERMISSIONS } from "@/lib/auth/core";
import { requirePermission } from "@/lib/auth/session";
import {
  publishWorkflowItem,
  rejectWorkflowItem,
  submitContentWorkflow,
} from "@/lib/workflow/content";

type SubmitContentOptions = {
  publishDirectly?: boolean;
};

export async function submitContentForReview(
  content: HotsiteContent,
  options?: SubmitContentOptions,
) {
  const requiredPermission = content.contentId ? PERMISSIONS.CONTENT_EDIT : PERMISSIONS.CONTENT_CREATE;
  const session = await requirePermission(requiredPermission);
  const publishDirectly = options?.publishDirectly === true;

  if (publishDirectly) {
    await requirePermission(PERMISSIONS.CONTENT_PUBLISH);
  }

  const result = await submitContentWorkflow(content, session, publishDirectly);

  revalidatePath("/");
  revalidatePath("/cms/approvals");

  if (result.wakeContentId) {
    revalidatePath(`/cms/content/edit/${result.wakeContentId}`);
  }

  return result;
}

export async function publishPendingContent(workflowId: string) {
  const session = await requirePermission(PERMISSIONS.CONTENT_PUBLISH);
  const result = await publishWorkflowItem(workflowId, session);

  revalidatePath("/cms/approvals");
  revalidatePath(`/cms/content/edit/${result.wakeContentId}`);

  return result;
}

export async function rejectPendingContent(workflowId: string) {
  const session = await requirePermission(PERMISSIONS.CONTENT_PUBLISH);
  const result = await rejectWorkflowItem(workflowId, session);

  revalidatePath("/cms/approvals");
  revalidatePath(`/cms/approvals/${workflowId}/preview`);

  return result;
}

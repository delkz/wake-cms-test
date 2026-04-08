"use server";

import { revalidatePath } from "next/cache";

import type { Hotsite } from "@/app/lib/cms/types";
import { PERMISSIONS } from "@/lib/auth/core";
import { requirePermission } from "@/lib/auth/session";
import { submitHotsiteWorkflow } from "@/lib/workflow/hotsite";

type SubmitHotsiteOptions = {
  publishDirectly?: boolean;
};

export async function submitHotsiteForReview(
  hotsite: Hotsite,
  options?: SubmitHotsiteOptions,
) {
  const requiredPermission = hotsite.hotsiteId
    ? PERMISSIONS.HOTSITE_UPDATE
    : PERMISSIONS.HOTSITE_CREATE;
  const session = await requirePermission(requiredPermission);
  const publishDirectly = options?.publishDirectly === true;

  if (publishDirectly) {
    await requirePermission(PERMISSIONS.CONTENT_PUBLISH);
  }

  const result = await submitHotsiteWorkflow(hotsite, session, publishDirectly);

  revalidatePath("/");
  revalidatePath("/cms/approvals");

  if (result.wakeHotsiteId) {
    revalidatePath(`/cms/hotsite/${result.wakeHotsiteId}`);
  }

  return result;
}

"use server";

import { revalidatePath } from "next/cache";

import type { UploadBannerOptions } from "@/app/lib/cms/banners-api";
import { PERMISSIONS } from "@/lib/auth/core";
import { requirePermission } from "@/lib/auth/session";
import { submitBannerWorkflow } from "@/lib/workflow/banner";

type SubmitBannerOptions = {
  publishDirectly?: boolean;
  mode: "create" | "update";
};

export async function submitBannerForReview(
  banner: UploadBannerOptions,
  options: SubmitBannerOptions,
) {
  const requiredPermission =
    options.mode === "create" ? PERMISSIONS.BANNER_CREATE : PERMISSIONS.BANNER_UPDATE;
  const session = await requirePermission(requiredPermission);
  const result = await submitBannerWorkflow(banner, session, options.publishDirectly === true);

  revalidatePath("/");
  revalidatePath("/cms/approvals");
  if (result.wakeBannerId) {
    revalidatePath(`/cms/banner/edit/${result.wakeBannerId}`);
  }

  return result;
}

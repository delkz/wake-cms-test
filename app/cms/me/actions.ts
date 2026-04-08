"use server";

import { revalidatePath } from "next/cache";

import { createSession, requireSession } from "@/lib/auth/session";
import { updateOwnDisplayName } from "@/lib/auth/users";

function getDisplayName(formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (displayName.length < 2) {
    throw new Error("Nome deve ter pelo menos 2 caracteres.");
  }

  if (displayName.length > 80) {
    throw new Error("Nome deve ter no maximo 80 caracteres.");
  }

  return displayName;
}

export async function saveMyDisplayName(formData: FormData) {
  const session = await requireSession();
  const displayName = getDisplayName(formData);

  await updateOwnDisplayName({
    username: session.username,
    displayName,
  });

  await createSession({
    ...session,
    displayName,
  });

  revalidatePath("/cms/me");
  revalidatePath("/");
}

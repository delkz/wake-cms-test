"use server";

import { redirect } from "next/navigation";

import { createSession, deleteSession } from "@/lib/auth/session";
import { authenticateUser } from "@/lib/auth/users";

export type LoginActionState = {
  error?: string;
};

function getString(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

export async function login(
  _previousState: LoginActionState | undefined,
  formData: FormData,
): Promise<LoginActionState> {
  const username = getString(formData, "username");
  const password = getString(formData, "password");

  if (!username || !password) {
    return {
      error: "Informe usuario e senha.",
    };
  }

  const user = await authenticateUser(username, password);

  if (!user) {
    return {
      error: "Usuario ou senha invalidos.",
    };
  }

  await createSession(user);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

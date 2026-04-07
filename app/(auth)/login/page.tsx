import { redirect } from "next/navigation";

import LoginForm from "@/app/(auth)/login/login-form";
import { getSession } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ switch?: string }>;
}) {
  const session = await getSession();
  const resolvedSearchParams = await searchParams;

  if (session && resolvedSearchParams.switch !== "1") {
    redirect("/");
  }

  return (
    <main className="page-wrap flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        <div className="space-y-2 text-center">
          <p className="island-kicker">Wake CMS</p>
          <h1 className="display-title text-4xl font-bold sm:text-5xl">Faca login para continuar</h1>
          <p className="text-muted-foreground">
            A sessao e mantida em cookie e as permissoes controlam quais opcoes do CMS ficam
            visiveis.
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}

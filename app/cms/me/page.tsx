import { saveMyDisplayName } from "@/app/cms/me/actions";
import { formatPermissionLabel } from "@/lib/auth/core";
import { requireSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function MyUserPage() {
  const session = await requireSession();

  return (
    <main>
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">Conta</p>
        <h1 className="display-title mb-3 text-4xl font-bold sm:text-5xl">Usuario atual</h1>
        <p className="mb-6 text-muted-foreground">
          Atualize seu nome exibido e confira as permissoes disponiveis para sua conta.
        </p>

        <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
          <form action={saveMyDisplayName} className="rounded-xl border p-4">
            <h2 className="mb-3 text-lg font-semibold">Editar nome</h2>

            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="displayName">
                Nome exibido
              </label>
              <input
                id="displayName"
                name="displayName"
                defaultValue={session.displayName}
                minLength={2}
                maxLength={80}
                className="rounded-lg border bg-background px-3 py-2"
              />
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              Usuario: {session.username} | Perfil: {session.role}
            </p>

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Salvar nome
              </button>
            </div>
          </form>

          <section className="rounded-xl border p-4">
            <h2 className="mb-3 text-lg font-semibold">Permissoes da conta</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {session.permissions.map((permission) => (
                <span
                  key={permission}
                  className="rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide"
                >
                  {formatPermissionLabel(permission)}
                </span>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

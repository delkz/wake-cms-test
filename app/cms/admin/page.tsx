import { listUsers } from "@/lib/auth/users";
import { requireGlobalPermission } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireGlobalPermission();
  const users = await listUsers();

  return (
    <main className="">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">Area privada</p>
        <h1 className="display-title mb-3 text-4xl font-bold sm:text-5xl">
          Administracao de acessos
        </h1>
        <p className="mb-6 text-muted-foreground">
          Esta tela existe para demonstrar uma opcao privada: so o usuario com permissao global
          consegue acessa-la.
        </p>

        <div className="grid gap-4">
          {users.map((user) => (
            <div key={user.username} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{user.displayName}</h2>
                  <p className="text-sm text-muted-foreground">
                    Usuario: {user.username} | Perfil: {user.role}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {user.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

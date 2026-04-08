import { saveUserAccess } from "@/app/cms/admin/actions";
import { ALL_PERMISSIONS, formatPermissionLabel } from "@/lib/auth/core";
import { listUsers } from "@/lib/auth/users";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/core";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requirePermission(PERMISSIONS.USER_MANAGE);
  const users = await listUsers();

  return (
    <main className="">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">Area privada</p>
        <h1 className="display-title mb-3 text-4xl font-bold sm:text-5xl">
          Administracao de acessos
        </h1>
        <p className="mb-6 text-muted-foreground">
          O admin consegue revisar usuarios, trocar perfil e ajustar as permissoes granulares sem
          perder o modelo de permissao que ja existia no projeto.
        </p>

        <div className="grid gap-4">
          {users.map((user) => (
            <form key={user.username} action={saveUserAccess} className="rounded-xl border p-4">
              <input type="hidden" name="username" value={user.username} />

              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{user.displayName}</h2>
                  <p className="text-sm text-muted-foreground">
                    Usuario: {user.username} | Perfil atual: {user.role}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {user.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide"
                    >
                      {formatPermissionLabel(permission)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[220px,1fr]">
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor={`role-${user.username}`}>
                    Perfil
                  </label>
                  <select
                    id={`role-${user.username}`}
                    name="role"
                    defaultValue={user.role.toUpperCase()}
                    className="rounded-lg border bg-background px-3 py-2"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="PUBLISHER">Publicador</option>
                    <option value="EDITOR">Editor</option>
                  </select>
                </div>

                <div className="grid gap-3">
                  <p className="text-sm font-medium">Permissoes</p>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {ALL_PERMISSIONS.map((permission) => (
                      <label
                        key={`${user.username}-${permission}`}
                        className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          name={`permission:${permission}`}
                          defaultChecked={user.permissions.includes(permission)}
                        />
                        <span>{formatPermissionLabel(permission)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Salvar permissoes
                </button>
              </div>
            </form>
          ))}
        </div>
      </section>
    </main>
  );
}

import AdminUsersPanel from "@/app/cms/admin/admin-users-panel";
import { listUsers } from "@/lib/auth/users";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/core";

export const dynamic = "force-dynamic";

export default async function AdminPage({
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.USER_MANAGE);
  const users = await listUsers();

  return (
    <main className="">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">Area privada</p>
        <h1 className="display-title mb-3 text-4xl font-bold sm:text-5xl">
          Administracao de acessos
        </h1>
        <p className="mb-6 text-muted-foreground">
          O admin pode criar usuarios, inativar contas, editar nome exibido, trocar perfil e
          ajustar permissoes granulares.
        </p>

        <AdminUsersPanel users={users} currentUsername={session.username} />
      </section>
    </main>
  );
}

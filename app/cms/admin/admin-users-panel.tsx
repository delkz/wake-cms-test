"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  activateUserAccount,
  createUserAccount,
  deactivateUserAccount,
  saveUserAccess,
} from "@/app/cms/admin/actions";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { ALL_PERMISSIONS, formatPermissionLabel, type Permission, type UserRole } from "@/lib/auth/core";

type AdminUser = {
  username: string;
  displayName: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
};

type AdminUsersPanelProps = {
  users: AdminUser[];
  currentUsername: string;
};

type AdminTab = "active" | "inactive";

export default function AdminUsersPanel({ users, currentUsername }: AdminUsersPanelProps) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<AdminTab>("active");
  const [pendingCreate, startCreateTransition] = useTransition();
  const [pendingSaveUser, startSaveTransition] = useTransition();
  const [pendingAccessChangeUser, setPendingAccessChangeUser] = useState<string | null>(null);

  const activeUsers = useMemo(() => users.filter((user) => user.isActive), [users]);
  const inactiveUsers = useMemo(() => users.filter((user) => !user.isActive), [users]);
  const usersToRender = selectedTab === "inactive" ? inactiveUsers : activeUsers;

  function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
  }

  function handleCreateUser(formData: FormData) {
    startCreateTransition(async () => {
      try {
        await createUserAccount(formData);
        toast.success("Usuario criado com sucesso.");
        router.refresh();
      } catch (error) {
        toast.error(getErrorMessage(error, "Nao foi possivel criar o usuario."));
      }
    });
  }

  function handleSaveUser(formData: FormData, username: string) {
    startSaveTransition(async () => {
      try {
        await saveUserAccess(formData);
        toast.success(`Usuario ${username} atualizado com sucesso.`);
        router.refresh();
      } catch (error) {
        toast.error(getErrorMessage(error, "Nao foi possivel salvar os dados do usuario."));
      }
    });
  }

  function handleToggleUserActive(username: string, isActive: boolean) {
    setPendingAccessChangeUser(username);

    const formData = new FormData();
    formData.set("username", username);

    return (isActive ? deactivateUserAccount(formData) : activateUserAccount(formData))
      .then(() => {
        toast.success(isActive ? "Usuario inativado com sucesso." : "Usuario reativado com sucesso.");
        router.refresh();
      })
      .catch((error) => {
        toast.error(
          getErrorMessage(
            error,
            isActive
              ? "Nao foi possivel inativar o usuario."
              : "Nao foi possivel reativar o usuario.",
          ),
        );
      })
      .finally(() => {
        setPendingAccessChangeUser(null);
      });
  }

  return (
    <>
      <section className="mb-6 rounded-xl border border-amber-300 bg-amber-50/60 p-4 text-sm text-amber-900">
        <p className="font-semibold">Atencao</p>
        <p>
          Inativar um usuario revoga o acesso imediatamente. A conta pode ser reativada depois sem
          perda de historico.
        </p>
      </section>

      <section className="mb-6 rounded-xl border p-4">
        <h2 className="mb-3 text-lg font-semibold">Criar novo usuario</h2>
        <form
          action={handleCreateUser}
          className="grid gap-4"
          onSubmit={(event) => {
            if (pendingCreate) {
              event.preventDefault();
            }
          }}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="create-username">
                Usuario
              </label>
              <input
                id="create-username"
                name="username"
                placeholder="exemplo.usuario"
                minLength={3}
                maxLength={32}
                required
                className="rounded-lg border bg-background px-3 py-2"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="create-displayName">
                Nome exibido
              </label>
              <input
                id="create-displayName"
                name="displayName"
                minLength={2}
                maxLength={80}
                required
                className="rounded-lg border bg-background px-3 py-2"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="create-password">
                Senha
              </label>
              <input
                id="create-password"
                name="password"
                type="password"
                minLength={4}
                maxLength={120}
                required
                className="rounded-lg border bg-background px-3 py-2"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="create-role">
                Perfil
              </label>
              <select
                id="create-role"
                name="role"
                defaultValue="EDITOR"
                className="rounded-lg border bg-background px-3 py-2"
              >
                <option value="ADMIN">Admin</option>
                <option value="PUBLISHER">Publicador</option>
                <option value="EDITOR">Editor</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3">
            <p className="text-sm font-medium">Permissoes iniciais</p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {ALL_PERMISSIONS.map((permission) => (
                <label
                  key={`create-${permission}`}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <input type="checkbox" name={`permission:${permission}`} />
                  <span>{formatPermissionLabel(permission)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pendingCreate}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingCreate ? "Criando..." : "Criar usuario"}
            </button>
          </div>
        </form>
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedTab("active")}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
            selectedTab === "active" ? "bg-primary text-primary-foreground" : ""
          }`}
        >
          Ativos ({activeUsers.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedTab("inactive")}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
            selectedTab === "inactive" ? "bg-primary text-primary-foreground" : ""
          }`}
        >
          Inativos ({inactiveUsers.length})
        </button>
      </div>

      <div className="grid gap-4">
        {usersToRender.map((user) => (
          <form
            key={user.username}
            action={(formData) => handleSaveUser(formData, user.username)}
            className="rounded-xl border p-4"
            onSubmit={(event) => {
              if (pendingSaveUser || pendingAccessChangeUser === user.username) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="username" value={user.username} />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{user.displayName}</h2>
                <p className="text-sm text-muted-foreground">
                  Usuario: {user.username} | Perfil atual: {user.role} | Status:{" "}
                  {user.isActive ? "ativo" : "inativo"}
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
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor={`displayName-${user.username}`}>
                    Nome exibido
                  </label>
                  <input
                    id={`displayName-${user.username}`}
                    name="displayName"
                    defaultValue={user.displayName}
                    minLength={2}
                    maxLength={80}
                    className="rounded-lg border bg-background px-3 py-2"
                  />
                </div>

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

            <div className="mt-4 flex justify-end gap-2">
              {user.isActive ? (
                <ConfirmActionButton
                  title="Inativar usuario"
                  description={`Confirma a inativacao de ${user.displayName}? O acesso sera revogado imediatamente.`}
                  triggerLabel="Inativar usuario"
                  confirmLabel="Sim, inativar"
                  variant="destructive"
                  disabled={user.username === currentUsername || pendingAccessChangeUser === user.username}
                  successMessage="Usuario inativado com sucesso."
                  errorMessage="Nao foi possivel inativar o usuario."
                  onConfirm={async () => {
                    await handleToggleUserActive(user.username, true);
                  }}
                />
              ) : (
                <ConfirmActionButton
                  title="Reativar usuario"
                  description={`Confirma a reativacao de ${user.displayName}?`}
                  triggerLabel="Reativar usuario"
                  confirmLabel="Sim, reativar"
                  variant="outline"
                  disabled={pendingAccessChangeUser === user.username}
                  successMessage="Usuario reativado com sucesso."
                  errorMessage="Nao foi possivel reativar o usuario."
                  onConfirm={async () => {
                    await handleToggleUserActive(user.username, false);
                  }}
                />
              )}

              <button
                type="submit"
                disabled={pendingSaveUser || pendingAccessChangeUser === user.username}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingSaveUser ? "Salvando..." : "Salvar usuario"}
              </button>
            </div>
          </form>
        ))}

        {usersToRender.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Nenhum usuario nesta aba.
          </div>
        ) : null}
      </div>
    </>
  );
}

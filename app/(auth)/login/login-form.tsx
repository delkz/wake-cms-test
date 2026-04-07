"use client";

import { useActionState } from "react";

import { login, type LoginActionState } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginActionState = {};

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <div className="grid gap-6">
      <form action={action} className="grid gap-4 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="grid gap-2">
          <Label htmlFor="username">Usuario</Label>
          <Input id="username" name="username" placeholder="admin ou user" autoComplete="username" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Digite sua senha"
            autoComplete="current-password"
          />
        </div>

        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

        <Button type="submit" disabled={pending}>
          {pending ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="grid gap-3 rounded-2xl border border-dashed p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Acesso rapido
          </p>
          <p className="text-sm text-muted-foreground">
            Use os usuarios demo para alternar permissoes rapidamente.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <form action={action} className="grid gap-2 rounded-xl border p-4">
            <input type="hidden" name="username" value="admin" />
            <input type="hidden" name="password" value="admin" />
            <p className="font-medium">Administrador</p>
            <p className="text-sm text-muted-foreground">Acesso global a todas as opcoes.</p>
            <Button type="submit" variant="outline" disabled={pending}>
              Entrar como admin
            </Button>
          </form>

          <form action={action} className="grid gap-2 rounded-xl border p-4">
            <input type="hidden" name="username" value="user" />
            <input type="hidden" name="password" value="user" />
            <p className="font-medium">Editor</p>
            <p className="text-sm text-muted-foreground">
              Pode editar conteudos existentes, mas nao criar novos nem ver a area administrativa.
            </p>
            <Button type="submit" variant="outline" disabled={pending}>
              Entrar como user
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

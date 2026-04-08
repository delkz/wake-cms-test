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
          <Input
            id="username"
            name="username"
            placeholder="admin, publisher ou editor"
            autoComplete="username"
          />
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
            <p className="text-sm text-muted-foreground">
              Gerencia usuarios, revisa permissoes e pode publicar qualquer conteudo.
            </p>
            <Button type="submit" variant="outline" disabled={pending}>
              Entrar como admin
            </Button>
          </form>

          <form action={action} className="grid gap-2 rounded-xl border p-4">
            <input type="hidden" name="username" value="publisher" />
            <input type="hidden" name="password" value="publisher" />
            <p className="font-medium">Publicador</p>
            <p className="text-sm text-muted-foreground">
              Pode editar, revisar aprovacoes pendentes e publicar na Wake.
            </p>
            <Button type="submit" variant="outline" disabled={pending}>
              Entrar como publicador
            </Button>
          </form>

          <form action={action} className="grid gap-2 rounded-xl border p-4 md:col-span-2">
            <input type="hidden" name="username" value="editor" />
            <input type="hidden" name="password" value="editor" />
            <p className="font-medium">Editor</p>
            <p className="text-sm text-muted-foreground">
              Pode criar ou editar conteudos e solicitar aprovacao, mas nao publica direto.
            </p>
            <Button type="submit" variant="outline" disabled={pending}>
              Entrar como editor
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

import { cmsApi, type Hotsite } from "@/app/lib/cms-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type HotsiteSettingsFormProps = {
  hotsite: Hotsite;
  canUpdate: boolean;
  canDelete: boolean;
};

type FormErrors = {
  nome?: string;
  url?: string;
};

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function HotsiteSettingsForm({
  hotsite,
  canUpdate,
  canDelete,
}: HotsiteSettingsFormProps) {
  const [nome, setNome] = useState(hotsite.nome);
  const [url, setUrl] = useState(hotsite.url);
  const [ativo, setAtivo] = useState(hotsite.ativo);
  const [errors, setErrors] = useState<FormErrors>({});
  const [statusMessage, setStatusMessage] = useState("");

  function validate() {
    const nextErrors: FormErrors = {};

    if (!nome.trim()) {
      nextErrors.nome = "Informe o nome do hotsite.";
    }

    if (url.trim() && !isValidUrl(url)) {
      nextErrors.url = "Informe uma URL valida com http:// ou https://.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleUpdate() {
    if (!validate()) {
      setStatusMessage("Corrija os campos obrigatorios antes de continuar.");
      return;
    }

    await cmsApi.updateHotsite({
      hotsiteId: hotsite.hotsiteId,
      nome,
      url,
      ativo,
    });

    setStatusMessage("Atualizacao prevista na API, mas ainda nao implementada.");
  }

  async function handleDelete() {
    await cmsApi.deleteHotsite(hotsite.hotsiteId);
    setStatusMessage("Exclusao prevista na API, mas ainda nao implementada.");
  }

  console.log("HotsiteSettingsForm render", { nome, url, ativo, errors, statusMessage });

  return (
    <details className="mb-6 rounded-xl border bg-background" open>
      <summary className="cursor-pointer list-none px-4 py-3 font-medium">
        Configuracoes do hotsite
      </summary>

      <div className="grid gap-6 border-t p-4">
        <div className="grid gap-2">
          <Label htmlFor="hotsite-nome">Nome</Label>
          <Input
            id="hotsite-nome"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Nome do hotsite"
          />
          {errors.nome ? <p className="text-sm text-red-600">{errors.nome}</p> : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="hotsite-url">URL</Label>
          <Input
            id="hotsite-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Deixe vazio para a home"
          />
          {errors.url ? <p className="text-sm text-red-600">{errors.url}</p> : null}
        </div>

        <div className="hidden items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="hotsite-ativo">Ativo</Label>
            <p className="text-sm text-muted-foreground">
              Define se o hotsite fica ativo ou inativo.
            </p>
          </div>
          <Switch id="hotsite-ativo" checked={ativo} onCheckedChange={setAtivo} />
        </div>

        <div className="flex flex-wrap gap-2">
          {canUpdate ? (
            <Button type="button" onClick={handleUpdate}>
              Atualizar hotsite
            </Button>
          ) : null}

          {canDelete ? (
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Deletar hotsite
            </Button>
          ) : null}
        </div>

        {statusMessage ? <p className="text-sm text-muted-foreground">{statusMessage}</p> : null}
      </div>
    </details>
  );
}

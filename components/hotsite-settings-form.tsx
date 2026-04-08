"use client";

import { useState } from "react";
import { toast } from "sonner";

import { submitHotsiteForReview } from "@/app/cms/hotsite/actions";
import { cmsApi, type Hotsite } from "@/app/lib/cms-api";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type HotsiteSettingsFormProps = {
  hotsite: Hotsite;
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
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
  canPublish,
}: HotsiteSettingsFormProps) {
  const [nome, setNome] = useState(hotsite.nome);
  const [url, setUrl] = useState(hotsite.url);
  const [ativo, setAtivo] = useState(hotsite.ativo);
  const [errors, setErrors] = useState<FormErrors>({});

  function validate() {
    const nextErrors: FormErrors = {};

    if (!nome.trim()) {
      nextErrors.nome = "Informe o nome do hotsite.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submitUpdate(publishDirectly = false) {
    if (!validate()) {
      toast.error("Corrija os campos obrigatorios antes de continuar.");
      return;
    }

    await submitHotsiteForReview({
      workflowId: hotsite.workflowId,
      hotsiteId: hotsite.hotsiteId,
      nome,
      url,
      ativo,
      banners: hotsite.banners,
      conteudos: hotsite.conteudos,
    }, {
      publishDirectly,
    });

    if (publishDirectly) {
      toast.success("Hotsite publicado com sucesso.");
      window.location.reload();
      return;
    }

    toast.success("Alteracoes do hotsite enviadas para aprovacao.");
    window.location.href = "/cms/approvals";
  }

  async function handleUpdate() {
    await submitUpdate(false);
  }

  async function handleDelete() {
    await cmsApi.deleteHotsite(hotsite.hotsiteId);
  }

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
            <>
              <Button type="button" onClick={handleUpdate}>
                Salvar para aprovacao
              </Button>

              {canPublish ? (
                <ConfirmActionButton
                  title="Publicar hotsite"
                  description="Tem certeza? Essa acao publica as alteracoes do hotsite imediatamente."
                  triggerLabel="Publicar agora"
                  confirmLabel="Sim, publicar"
                  successMessage="Hotsite publicado com sucesso."
                  errorMessage="Nao foi possivel publicar o hotsite."
                  onConfirm={async () => {
                    await submitUpdate(true);
                  }}
                />
              ) : null}
            </>
          ) : null}

          {canDelete ? (
            <ConfirmActionButton
              title="Deletar hotsite"
              description="Tem certeza? Essa acao e irreversivel e pode afetar conteudos e vinculacoes do hotsite."
              triggerLabel="Deletar hotsite"
              confirmLabel="Sim, deletar"
              variant="destructive"
              successMessage="Exclusao prevista na API, mas ainda nao implementada."
              errorMessage="Nao foi possivel deletar o hotsite."
              onConfirm={handleDelete}
            />
          ) : null}
        </div>
      </div>
    </details>
  );
}

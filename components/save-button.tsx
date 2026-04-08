"use client"

import { startTransition, useState } from "react";
import { toast } from "sonner";

import type { HotsiteContent } from "@/app/lib/cms-api"
import { submitContentForReview } from "@/app/cms/content/actions";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { useEditorHtmlStore } from "@/app/lib/editor-html-store"
import { Button } from "@/components/ui/button"

export function SaveButton({
  currentContent,
  disabled,
  canPublish,
}: {
  currentContent: HotsiteContent | null
  disabled: boolean
  canPublish: boolean
}) {
  const html = useEditorHtmlStore((state) => state.html)
  const [pendingAction, setPendingAction] = useState<"save" | "publish" | null>(null);

  function buildPayload() {
    if (!currentContent) {
      return null;
    }

    return {
      workflowId: currentContent.workflowId,
      contentId: currentContent.contentId,
      title: currentContent.title,
      searchTerms: currentContent.searchTerms,
      content: html,
      position: currentContent.position,
      active: currentContent.active,
      dataInicio: currentContent.dataInicio,
      dataFim: currentContent.dataFim,
      exibeTodasBuscas: currentContent.exibeTodasBuscas,
      naoExibeBuscas: currentContent.naoExibeBuscas,
      exibeTodosHotsites: currentContent.exibeTodosHotsites,
      hotsiteId: currentContent.hotsiteId,
    };
  }

  async function handleSubmit(action: "save" | "publish") {
    const data = buildPayload();

    if (!data) {
      return
    }

    setPendingAction(action);

    startTransition(async () => {
      try {
        const result = await submitContentForReview(data, {
          publishDirectly: action === "publish",
        });
        if (result.mode === "published" && result.wakeContentId) {
          toast.success("Conteudo publicado com sucesso.");
          window.location.href = `/cms/content/edit/${result.wakeContentId}`;
          return;
        }

        toast.success("Conteudo salvo para aprovacao com sucesso.");
        window.location.href = "/cms/approvals";
      } catch (error) {
        console.error("Erro ao salvar conteudo:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao salvar a solicitacao de aprovacao.",
        );
      } finally {
        setPendingAction(null);
      }
    });
  }

  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        type="button"
        onClick={() => handleSubmit("save")}
        disabled={disabled || pendingAction !== null}
      >
        {pendingAction === "save" ? "Salvando..." : "Salvar"}
      </Button>

      {canPublish ? (
        <ConfirmActionButton
          title="Publicar conteudo"
          description="Tem certeza? Essa acao e irreversivel e vai enviar esta versao para a Wake."
          triggerLabel={pendingAction === "publish" ? "Publicando..." : "Publicar"}
          confirmLabel="Sim, publicar"
          disabled={disabled || pendingAction !== null}
          successMessage="Conteudo publicado com sucesso."
          errorMessage="Nao foi possivel publicar o conteudo."
          onConfirm={async () => {
            await handleSubmit("publish");
          }}
        />
      ) : null}
    </div>
  )
}

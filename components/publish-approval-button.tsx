"use client";

import { publishPendingContent } from "@/app/cms/content/actions";
import { ConfirmActionButton } from "@/components/confirm-action-button";

export function PublishApprovalButton({ workflowId }: { workflowId: string }) {
  return (
    <ConfirmActionButton
      title="Publicar aprovacao"
      description="Tem certeza? Essa acao e irreversivel e vai enviar esta versao para a Wake."
      triggerLabel="Publicar"
      confirmLabel="Sim, publicar"
      successMessage="Conteudo publicado com sucesso."
      errorMessage="Nao foi possivel publicar esta aprovacao."
      onConfirm={async () => {
        await publishPendingContent(workflowId);
        window.location.reload();
      }}
    />
  );
}

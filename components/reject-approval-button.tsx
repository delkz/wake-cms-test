"use client";

import { rejectPendingContent } from "@/app/cms/content/actions";
import { ConfirmActionButton } from "@/components/confirm-action-button";

export function RejectApprovalButton({ workflowId }: { workflowId: string }) {
  return (
    <ConfirmActionButton
      title="Reprovar aprovacao"
      description="Tem certeza? Essa acao e irreversivel e vai marcar esta revisao como reprovada."
      triggerLabel="Reprovar"
      confirmLabel="Sim, reprovar"
      variant="destructive"
      successMessage="Aprovacao reprovada com sucesso."
      errorMessage="Nao foi possivel reprovar esta aprovacao."
      onConfirm={async () => {
        await rejectPendingContent(workflowId);
        window.location.reload();
      }}
    />
  );
}

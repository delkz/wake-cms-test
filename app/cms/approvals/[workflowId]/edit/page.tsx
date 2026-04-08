import Link from "next/link";
import { redirect } from "next/navigation";

import ContentEditorForm from "@/components/content-editor-form";
import { Button } from "@/components/ui/button";
import { canPublishContent } from "@/lib/auth/authorization";
import { requireSession } from "@/lib/auth/session";
import { getApprovalItemForPreview } from "@/lib/workflow/approvals";

export const dynamic = "force-dynamic";

export default async function ApprovalEditPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const session = await requireSession();
  const { workflowId } = await params;
  const workflowItem = await getApprovalItemForPreview(workflowId, session);

  if (workflowItem.entityType === "HOTSITE") {
    if (!workflowItem.hotsite?.hotsiteId) {
      throw new Error("Hotsite da revisao nao encontrado.");
    }

    redirect(`/cms/hotsite/${workflowItem.hotsite.hotsiteId}?workflowId=${workflowId}`);
  }

  if (!workflowItem.content) {
    throw new Error("Conteudo da revisao nao encontrado.");
  }

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              Revisao em edicao
            </p>
            <h1 className="text-3xl font-bold">{workflowItem.title}</h1>
            <p className="text-sm text-muted-foreground">
              Esta tela continua editando a versao salva no workflow de aprovacao.
            </p>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/cms/approvals/${workflowId}/preview`}>Voltar ao preview</Link>
            </Button>
          </div>
        </div>
      </section>

      <ContentEditorForm
        initialContent={{
          ...workflowItem.content,
          workflowId: workflowItem.id,
        }}
        type="update"
        canPublish={canPublishContent(session)}
      />
    </main>
  );
}

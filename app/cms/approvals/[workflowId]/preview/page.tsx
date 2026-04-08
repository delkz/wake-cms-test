import Link from "next/link";

import { PublishApprovalButton } from "@/components/publish-approval-button";
import { RejectApprovalButton } from "@/components/reject-approval-button";
import { Button } from "@/components/ui/button";
import { canPublishContent } from "@/lib/auth/authorization";
import { requireSession } from "@/lib/auth/session";
import { getApprovalItemForPreview } from "@/lib/workflow/approvals";

export const dynamic = "force-dynamic";

function formatHotsites(value?: string | number[]) {
  if (!value) {
    return "Nenhum hotsite informado";
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "Nenhum hotsite informado";
  }

  return value || "Nenhum hotsite informado";
}

function formatSearchTerms(value: string[] | string) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ") || "Sem termos de busca";
  }

  return value || "Sem termos de busca";
}

export default async function ApprovalPreviewPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const session = await requireSession();
  const { workflowId } = await params;
  const workflowItem = await getApprovalItemForPreview(workflowId, session);
  const { content, hotsite } = workflowItem;
  const userCanPublish = canPublishContent(session);

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              Preview da aprovacao
            </p>
            <h1 className="text-3xl font-bold">{workflowItem.title}</h1>
            <p className="text-sm text-muted-foreground">
              Esta pagina mostra a versao pendente salva no workflow, sem buscar o conteudo
              publicado na Wake.
            </p>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/cms/approvals/${workflowId}/edit`}>Continuar editando</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/cms/approvals">Voltar para aprovacoes</Link>
            </Button>
            {workflowItem.entityType === "CONTENT" && content?.contentId ? (
              <Button asChild variant="outline">
                <Link href={`/cms/content/edit/${content.contentId}`}>Ver publicado</Link>
              </Button>
            ) : null}
            {workflowItem.entityType === "HOTSITE" && hotsite?.hotsiteId ? (
              <Button asChild variant="outline">
                <Link href={`/cms/hotsite/${hotsite.hotsiteId}`}>Ver publicado</Link>
              </Button>
            ) : null}
            {userCanPublish && workflowItem.status === "PENDING_REVIEW" ? (
              <>
                <RejectApprovalButton workflowId={workflowId} />
                <PublishApprovalButton workflowId={workflowId} />
              </>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium">{workflowItem.status}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Acao</p>
            <p className="font-medium">{workflowItem.action}</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Posicionamento</p>
            <p className="font-medium">
              {workflowItem.entityType === "CONTENT"
                ? (content?.position || "Nao informado")
                : "Nao aplicavel"}
            </p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Wake ID</p>
            <p className="font-medium">
              {workflowItem.entityType === "CONTENT"
                ? (content?.contentId || "Novo conteudo")
                : (hotsite?.hotsiteId || "Novo hotsite")}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <aside className="rounded-2xl border p-6">
          <h2 className="mb-4 text-xl font-semibold">Metadados</h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Solicitado por</p>
              <p>{workflowItem.requestedBy.displayName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Termos de busca</p>
              <p>
                {workflowItem.entityType === "CONTENT"
                  ? formatSearchTerms(content?.searchTerms || [])
                  : "Nao aplicavel"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Hotsites</p>
              <p>
                {workflowItem.entityType === "CONTENT"
                  ? formatHotsites(content?.hotsiteId)
                  : (hotsite?.hotsiteId || "Nao informado")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Ativo</p>
              <p>
                {workflowItem.entityType === "CONTENT"
                  ? (content?.active ? "Sim" : "Nao")
                  : (hotsite?.ativo ? "Sim" : "Nao")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Data de inicio</p>
              <p>
                {workflowItem.entityType === "CONTENT"
                  ? (content?.dataInicio || "Nao informada")
                  : "Nao aplicavel"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Data de fim</p>
              <p>
                {workflowItem.entityType === "CONTENT"
                  ? (content?.dataFim || "Nao informada")
                  : "Nao aplicavel"}
              </p>
            </div>
            {workflowItem.entityType === "HOTSITE" ? (
              <div>
                <p className="text-muted-foreground">URL</p>
                <p>{hotsite?.url || "Nao informada"}</p>
              </div>
            ) : null}
          </div>
        </aside>

        <section className="rounded-2xl border p-6">
          {workflowItem.entityType === "CONTENT" ? (
            <>
              <h2 className="mb-4 text-xl font-semibold">Conteudo renderizado</h2>
              <div
                className="prose max-w-none rounded-xl border bg-background p-6"
                dangerouslySetInnerHTML={{ __html: content?.content || "<p>Sem conteudo.</p>" }}
              />
            </>
          ) : (
            <>
              <h2 className="mb-4 text-xl font-semibold">Dados do hotsite</h2>
              <div className="rounded-xl border bg-background p-6 text-sm">
                <p>
                  Nome: <strong>{hotsite?.nome || "Hotsite sem nome"}</strong>
                </p>
                <p className="mt-2">URL: {hotsite?.url || "Nao informada"}</p>
                <p className="mt-2">Banners vinculados: {hotsite?.banners?.length || 0}</p>
                <p className="mt-2">Conteudos vinculados: {hotsite?.conteudos?.length || 0}</p>
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

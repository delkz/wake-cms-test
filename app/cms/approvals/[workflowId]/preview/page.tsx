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

function formatBannerImage(value?: { nome: string; formato: string } | null) {
  if (!value) {
    return "Imagem nao informada";
  }

  return `${value.nome} (${value.formato})`;
}

export default async function ApprovalPreviewPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const session = await requireSession();
  const { workflowId } = await params;
  const workflowItem = await getApprovalItemForPreview(workflowId, session);
  const { content, hotsite, banner } = workflowItem;
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
            {workflowItem.entityType === "BANNER" && banner?.id ? (
              <Button asChild variant="outline">
                <Link href={`/cms/banner/edit/${banner.id}`}>Ver publicado</Link>
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
                : workflowItem.entityType === "BANNER"
                  ? (banner?.detalhe?.posicionamentoId ?? "Nao informado")
                  : "Nao aplicavel"}
            </p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">Wake ID</p>
            <p className="font-medium">
              {workflowItem.entityType === "CONTENT"
                ? (content?.contentId || "Novo conteudo")
                : workflowItem.entityType === "HOTSITE"
                  ? (hotsite?.hotsiteId || "Novo hotsite")
                  : (banner?.id ? String(banner.id) : "Novo banner")}
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
                  : workflowItem.entityType === "BANNER"
                    ? (banner?.apresentacao?.termosBusca || "Nao informado")
                    : "Nao aplicavel"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Hotsites</p>
              <p>
                {workflowItem.entityType === "CONTENT"
                  ? formatHotsites(content?.hotsiteId)
                  : workflowItem.entityType === "BANNER"
                    ? (banner?.apresentacao?.listaHotsites?.hotSites?.map((item) => item.hotSiteId).join(", ") || "Nao informado")
                    : (hotsite?.hotsiteId || "Nao informado")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Ativo</p>
              <p>
                {workflowItem.entityType === "CONTENT"
                  ? (content?.active ? "Sim" : "Nao")
                  : workflowItem.entityType === "BANNER"
                    ? (banner?.ativo ? "Sim" : "Nao")
                    : (hotsite?.ativo ? "Sim" : "Nao")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Data de inicio</p>
              <p>
                {workflowItem.entityType === "CONTENT"
                  ? (content?.dataInicio || "Nao informada")
                  : workflowItem.entityType === "BANNER"
                    ? (banner?.dataInicio || "Nao informada")
                    : "Nao aplicavel"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Data de fim</p>
              <p>
                {workflowItem.entityType === "CONTENT"
                  ? (content?.dataFim || "Nao informada")
                  : workflowItem.entityType === "BANNER"
                    ? (banner?.dataFim || "Nao informada")
                    : "Nao aplicavel"}
              </p>
            </div>
            {workflowItem.entityType === "HOTSITE" ? (
              <div>
                <p className="text-muted-foreground">URL</p>
                <p>{hotsite?.url || "Nao informada"}</p>
              </div>
            ) : null}
            {workflowItem.entityType === "BANNER" ? (
              <>
                <div>
                  <p className="text-muted-foreground">URL principal</p>
                  <p>{banner?.detalhe?.urlBanner || "Nao informada"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Imagem</p>
                  <p>{formatBannerImage(banner?.detalhe?.imagemBanner ?? null)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Texto alternativo</p>
                  <p>{banner?.detalhe?.textoAlternativo || "Nao informado"}</p>
                </div>
              </>
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
          ) : workflowItem.entityType === "BANNER" ? (
            <>
              <h2 className="mb-4 text-xl font-semibold">Dados do banner</h2>
              <div className="grid gap-3 rounded-xl border bg-background p-6 text-sm">
                <p>
                  Nome: <strong>{banner?.nome || "Banner sem nome"}</strong>
                </p>
                <p>Posicionamento: {banner?.detalhe?.posicionamentoId ?? "Nao informado"}</p>
                <p>URL principal: {banner?.detalhe?.urlBanner || "Nao informada"}</p>
                <p>URL clique: {banner?.detalhe?.urlClique || "Nao informada"}</p>
                <p>URL alternativa: {banner?.detalhe?.urlBannerAlternativo || "Nao informada"}</p>
                <p>Title: {banner?.detalhe?.title || "Nao informado"}</p>
                <p>Title alternativo: {banner?.detalhe?.titleAlternativo || "Nao informado"}</p>
                <p>Imagem: {formatBannerImage(banner?.detalhe?.imagemBanner ?? null)}</p>
                <p>Ordem de exibicao: {banner?.detalhe?.ordemExibicao ?? "Nao informada"}</p>
              </div>
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

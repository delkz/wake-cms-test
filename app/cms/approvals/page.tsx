import Link from "next/link";

import { WorkflowStatus } from "@prisma/client";

import { PublishApprovalButton } from "@/components/publish-approval-button";
import { RejectApprovalButton } from "@/components/reject-approval-button";
import { Button } from "@/components/ui/button";
import { canPublishContent } from "@/lib/auth/authorization";
import { requireSession } from "@/lib/auth/session";
import {
  listApprovalItemsForReview,
  listApprovalItemsForUser,
} from "@/lib/workflow/approvals";
import { listRecentWorkflowHistory } from "@/lib/workflow/content";

export const dynamic = "force-dynamic";

function formatWorkflowStatus(status: WorkflowStatus) {
  switch (status) {
    case WorkflowStatus.PENDING_REVIEW:
      return "Pendente";
    case WorkflowStatus.PUBLISHED:
      return "Publicado";
    case WorkflowStatus.REJECTED:
      return "Rejeitado";
    default:
      return status;
  }
}

function getWorkflowActionStyle(action: string) {
  switch (action) {
    case WorkflowStatus.PUBLISHED:
      return "bg-green-100 text-green-800";
    case WorkflowStatus.PENDING_REVIEW:
      return "bg-blue-100 text-blue-800";
    case WorkflowStatus.REJECTED:
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function formatHistoryEvent(eventType: string) {
  switch (eventType) {
    case "SAVED_FOR_REVIEW":
      return "salvou para aprovacao";
    case "UPDATED_REVIEW":
      return "atualizou a revisao";
    case "REJECTED":
      return "reprovou";
    case "PUBLISHED":
      return "publicou";
    default:
      return eventType.toLowerCase();
  }
}

function formatEntityType(entityType: string) {
  if (entityType === "CONTENT") {
    return "conteudo";
  }

  if (entityType === "HOTSITE") {
    return "hotsite";
  }

  return "entidade";
}

function formatHistoryTimestamp(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ApprovalsPage() {
  const session = await requireSession();
  const userCanPublish = canPublishContent(session);
  const [pendingApprovals, myRequests, recentHistory] = await Promise.all([
    userCanPublish ? listApprovalItemsForReview() : Promise.resolve([]),
    listApprovalItemsForUser(session.username),
    listRecentWorkflowHistory(),
  ]);

  return (
    <main className="space-y-6">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">Workflow</p>
        <h1 className="display-title mb-3 text-4xl font-bold sm:text-5xl">
          Aprovacoes de alteracoes
        </h1>
        <p className="text-muted-foreground">
          Conteudos e hotsites passam por revisao. O publicador ou admin revisa e publica na Wake
          somente quando aprovar.
        </p>
      </section>

      {userCanPublish ? (
        <section className="rounded-2xl border p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Pendentes para publicar</h2>
              <p className="text-sm text-muted-foreground">
                Estas alteracoes ainda nao foram enviadas para a API Wake.
              </p>
            </div>
            <div className="rounded-full border px-3 py-1 text-sm font-medium">
              {pendingApprovals.length} pendente(s)
            </div>
          </div>

          <div className="grid gap-4">
            {pendingApprovals.map((item) => (
              <article key={item.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Solicitado por {item.requestedBy.displayName} ({item.requestedBy.username})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tipo: {item.entityType === "CONTENT" ? "conteudo" : "hotsite"} | Acao:{" "}
                      {item.action.toLowerCase()} | Wake ID atual: {item.targetEntityId || "novo"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline">
                      <Link href={`/cms/approvals/${item.id}/preview`}>Preview</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/cms/approvals/${item.id}/edit`}>Editar</Link>
                    </Button>
                    <RejectApprovalButton workflowId={item.id} />
                    <PublishApprovalButton workflowId={item.id} />
                  </div>
                </div>
              </article>
            ))}

            {pendingApprovals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma aprovacao pendente no momento.</p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold">Minhas solicitacoes</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe o status das alteracoes que voce enviou para aprovacao ou publicou.
          </p>
        </div>

        <div className="grid gap-4">
          {myRequests.map((item) => (
            <article key={item.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground ">
                    Status: {formatWorkflowStatus(item.status)} | Acao: {item.action.toLowerCase()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline">
                    <Link href={`/cms/approvals/${item.id}/preview`}>Preview</Link>
                  </Button>
                  {(item.status === WorkflowStatus.PENDING_REVIEW ||
                    item.status === WorkflowStatus.REJECTED) ? (
                    <Button asChild variant="outline">
                      <Link href={`/cms/approvals/${item.id}/edit`}>Continuar editando</Link>
                    </Button>
                  ) : null}
                  <div className={`rounded-full border px-3 py-1 text-sm font-medium ${getWorkflowActionStyle(item.status)}`}>
                    {formatWorkflowStatus(item.status)}
                  </div>
                </div>
              </div>
            </article>
          ))}

          {myRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Voce ainda nao criou nenhuma solicitacao de aprovacao.
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold">Ultimas alteracoes</h2>
          <p className="text-sm text-muted-foreground">
            Log recente do workflow, incluindo salvamentos, reprovacoes e publicacoes.
          </p>
        </div>

        <div className="grid gap-3">
          {recentHistory.map((entry) => (
            <article
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
            >
              <div className="space-y-1">
                <p className="font-medium">
                  {entry.actorDisplayName} ({entry.actorUsername}) {formatHistoryEvent(entry.eventType)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {entry.title} | {formatWorkflowStatus(entry.status)} |{" "}
                  {entry.targetEntityId
                    ? `${formatEntityType(entry.entityType)} ${entry.targetEntityId}`
                    : `Novo ${formatEntityType(entry.entityType)}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {entry.workflowItemId ? (
                  <Button asChild variant="outline">
                    <Link href={`/cms/approvals/${entry.workflowItemId}/preview`}>Abrir</Link>
                  </Button>
                ) : null}
                <div className="rounded-full border px-3 py-1 text-sm font-medium">
                  {formatHistoryTimestamp(entry.createdAt)}
                </div>
              </div>
            </article>
          ))}

          {recentHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma alteracao registrada no historico ainda.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

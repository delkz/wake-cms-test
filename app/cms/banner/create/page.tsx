import BannerEditorForm from "@/components/banner-editor-form";
import { canPublishContent } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/core";
import { requirePermission } from "@/lib/auth/session";
import { type BannerApiResponse } from "@/app/lib/cms/banners-api";
import { cmsApi } from "@/app/lib/cms-api";
import { getApprovalItemForPreview } from "@/lib/workflow/approvals";

export const dynamic = "force-dynamic";

export default async function NewBannerPage({
  searchParams,
}: {
  searchParams: Promise<{ hotsiteId?: string; workflowId?: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.BANNER_CREATE);
  const { hotsiteId, workflowId } = await searchParams;

  if (!hotsiteId) {
    throw new Error("Informe o hotsite para criar um banner.");
  }

  const data = await cmsApi.getHotsiteById(hotsiteId);
  const pendingItem = workflowId ? await getApprovalItemForPreview(workflowId, session) : null;
  const pendingBanner = pendingItem?.entityType === "BANNER" ? pendingItem.banner : null;
  const pendingHotsite =
    pendingItem?.entityType === "HOTSITE" && pendingItem.hotsite?.hotsiteId === hotsiteId
      ? {
          ...pendingItem.hotsite,
          workflowId: pendingItem.id,
        }
      : null;

  return (
    <main className="page-wrap px-4 py-12">
      <div className="container mx-auto mb-4">
        <h1 className="text-3xl text-primary">Novo banner</h1>
        <p className="text-sm text-muted-foreground">
          Crie um banner para o hotsite {data.nome} e envie para aprovacao.
        </p>
      </div>

      <div className="container mx-auto">
        <BannerEditorForm
          mode="create"
          hotsite={pendingHotsite ?? data}
          initialBannerDetails={pendingBanner ? (pendingBanner as BannerApiResponse) : undefined}
          canPublish={canPublishContent(session)}
        />
      </div>
    </main>
  );
}

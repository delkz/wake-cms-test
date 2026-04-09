import { cmsApi } from "@/app/lib/cms-api"
import HotsiteBannerList from "@/components/hotsite-banner-list";
import HotsiteContentList from "@/components/hotsite-content-list";
import HotsiteSettingsForm from "@/components/hotsite-settings-form";

import {
  canCreateBanner,
  canCreateHotsite,
  canCreateContent,
  canDeleteBanner,
  canDeleteHotsite,
  canEditContent,
  canPublishContent,
  canUpdateHotsite,
  canUpdateBanner,
} from "@/lib/auth/authorization";
import { requireSession } from "@/lib/auth/session";
import { getApprovalItemForPreview } from "@/lib/workflow/approvals";

export const dynamic = 'force-dynamic'

export default async function Hotsite({
  params,
  searchParams,
}: {
  params: Promise<{ hotsiteId: string }>
  searchParams: Promise<{ workflowId?: string }>
}) {
  const session = await requireSession();
  const { hotsiteId } = await params;
  const { workflowId } = await searchParams;
  const data = await cmsApi.getHotsiteById(hotsiteId)
  const userCanCreateContent = canCreateContent(session);
  const userCanEditContent = canEditContent(session);
  const userCanCreateHotsite = canCreateHotsite(session);
  const userCanUpdateHotsite = canUpdateHotsite(session);
  const userCanDeleteHotsite = canDeleteHotsite(session);
  const userCanPublish = canPublishContent(session);
  const userCanCreateBanner = canCreateBanner(session);
  const userCanUpdateBanner = canUpdateBanner(session);
  const userCanDeleteBanner = canDeleteBanner(session);

  const pendingItem = workflowId ? await getApprovalItemForPreview(workflowId, session) : null;
  const pendingHotsite =
    pendingItem?.entityType === "HOTSITE" && pendingItem.hotsite?.hotsiteId === hotsiteId
      ? {
          ...pendingItem.hotsite,
          workflowId: pendingItem.id,
        }
      : null;

  const initialHotsite = pendingHotsite ?? data;

  return (
    <main className="page-wrap px-4 py-12">
      <h1 className="display-title mb-3 text-4xl font-bold sm:text-5xl">
        Detalhes do Hotsite <span className="text-primary">{data.nome}</span>
      </h1>

      {userCanCreateHotsite || userCanUpdateHotsite || userCanDeleteHotsite ? (
        <HotsiteSettingsForm
          hotsite={initialHotsite}
          canUpdate={userCanUpdateHotsite}
          canDelete={userCanDeleteHotsite}
          canPublish={userCanPublish}
        />
      ) : null}

      <hr />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HotsiteContentList
          contents={initialHotsite.conteudos}
          hotsiteId={initialHotsite.hotsiteId}
          canEdit={userCanEditContent}
          canCreate={userCanCreateContent}
        />
        <HotsiteBannerList
          banners={initialHotsite.banners}
          hotsiteId={initialHotsite.hotsiteId}
          workflowId={workflowId}
          canCreate={userCanCreateBanner}
          canUpdate={userCanUpdateBanner}
          canDelete={userCanDeleteBanner}
        />
      </div>



    </main>
  )

}

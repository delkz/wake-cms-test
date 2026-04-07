import { cmsApi } from "@/app/lib/cms-api"
import { Button } from "@/components/ui/button";
import HotsiteBannerList from "@/components/hotsite-banner-list";
import HotsiteContentList from "@/components/hotsite-content-list";

import Link from "next/link";
import {
  canCreateBanner,
  canCreateContent,
  canDeleteBanner,
  canEditContent,
  canUpdateBanner,
} from "@/lib/auth/authorization";
import { requireSession } from "@/lib/auth/session";

export const dynamic = 'force-dynamic'

export default async function Hotsite({
  params,
}: {
  params: Promise<{ hotsiteId: string }>
}) {
  const session = await requireSession();
  const { hotsiteId } = await params;
  const data = await cmsApi.getHotsiteById(hotsiteId)
  const userCanCreateContent = canCreateContent(session);
  const userCanEditContent = canEditContent(session);
  const userCanCreateBanner = canCreateBanner(session);
  const userCanUpdateBanner = canUpdateBanner(session);
  const userCanDeleteBanner = canDeleteBanner(session);

  return (
    <main className="">
      <h1 className="display-title mb-3 text-4xl font-bold sm:text-5xl">
        Detalhes do Hotsite <span className="text-primary">{data.nome}</span>
      </h1>
     
       <hr />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HotsiteContentList
          contents={data.conteudos}
          hotsiteId={data.hotsiteId}
          canEdit={userCanEditContent}
          canCreate={userCanCreateContent}
        />
        <HotsiteBannerList
          banners={data.banners}
          canCreate={userCanCreateBanner}
          canUpdate={userCanUpdateBanner}
          canDelete={userCanDeleteBanner}
        />
      </div>



    </main>
  )

}

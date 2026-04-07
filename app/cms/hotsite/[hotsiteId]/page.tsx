import { cmsApi } from "@/app/lib/cms-api"
import { Button } from "@/components/ui/button";
import HotsiteContentList from "@/components/hotsite-content-list";

import Link from "next/link";
import { canCreateContent, canEditContent } from "@/lib/auth/authorization";
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

  return (
    <main className="">
      <h1 className="display-title mb-3 text-4xl font-bold sm:text-5xl">
        Detalhes do Hotsite <span className="text-primary">{data.nome}</span>
      </h1>
     
      <div className="flex">
        {userCanCreateContent ? (
          <Button asChild>
            <Link href={`/cms/content/create?hotsiteId=${data.hotsiteId}`}>Novo Conteudo</Link>
          </Button>
        ) : (
          <></>
        )}
      </div>
       <hr />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HotsiteContentList
          contents={data.conteudos}
          hotsiteId={data.hotsiteId}
          canEdit={userCanEditContent}
        />
        <div>
          <h2>Banners</h2>
          <div className="rounded-lg border border-(--chip-line) p-4 mb-4">
            {data.banners.map((banner) => (
              <div key={banner.bannerId} className="mb-4">
                <h3 className="text-xl font-semibold mb-1">{banner.bannerName}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>



    </main>
  )

}

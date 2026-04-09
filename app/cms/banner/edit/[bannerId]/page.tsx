import BannerEditorForm from "@/components/banner-editor-form";
import { getBanner } from "@/app/lib/cms/banners-api";
import { canPublishContent } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/core";
import { requirePermission } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ bannerId: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.BANNER_UPDATE);
  const { bannerId } = await params;
  const bannerDetails = await getBanner(bannerId).catch(() => null);

  if (!bannerDetails) {
    throw new Error("Banner nao encontrado.");
  }

  return (
    <main className="page-wrap px-4 py-12">
      <div className="container mx-auto mb-4">
        <h1 className="text-3xl text-primary">Editar banner {bannerDetails.nome}</h1>
        <p className="text-sm text-muted-foreground">
          Ajuste os dados do banner de forma independente.
        </p>
      </div>

      <div className="container mx-auto">
        <BannerEditorForm
          mode="update"
          initialBanner={{
            bannerId,
            bannerName: bannerDetails.nome,
            bannerUrl: bannerDetails.detalhe.urlBannerAlternativo || bannerDetails.detalhe.urlClique || "",
            position: "",
          }}
          initialBannerDetails={bannerDetails}
          canPublish={canPublishContent(session)}
        />
      </div>
    </main>
  );
}


import { cmsApi } from "@/app/lib/cms-api";
import ContentEditorForm from "@/components/content-editor-form";
import { canPublishContent } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/core";
import { requirePermission } from "@/lib/auth/session";

export const dynamic = 'force-dynamic'

export default async function Content({
    params
}: {
    params: Promise<{ contentId: string }>
}) {
    const session = await requirePermission(PERMISSIONS.CONTENT_EDIT);
    const { contentId } = await params;

    const data = await cmsApi.getContentById(contentId)

    
    return (
        <main className="page-wrap px-4 py-12">
            <div className="container mb-4 mx-auto">
                <h1 className="text-3xl text-primary ">Editando o conteudo {data.title}</h1>
            </div>
            <div className="bg-yellow-50 border border-dashed border-yellow-400 rounded-lg mb-6">
                <div className="p-4">
                    <p className="text-yellow-800 text-sm">
                        Cuidado ao editar este conteudo, ele pode estar sendo exibido em um ou mais hotsites. Verifique os hotsites associados a este conteudo antes de realizar qualquer alteração.<br></br>
                        <b>As alterações podem demorar até 5 minutos para refletir nos hotsites devido a cache.</b>
                    </p>
                </div>
            </div>
            <div className="container mx-auto">
                <ContentEditorForm
                    initialContent={data}
                    type="update"
                    canPublish={canPublishContent(session)}
                />
            </div>

        </main>
    )
}

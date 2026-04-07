
import { cmsApi } from "@/app/lib/cms-api";
import { SaveButton } from "@/components/save-button";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { PERMISSIONS } from "@/lib/auth/core";
import { requirePermission } from "@/lib/auth/session";

export const dynamic = 'force-dynamic'

export default async function Content({
    params
}: {
    params: Promise<{ contentId: string }>
}) {
    await requirePermission(PERMISSIONS.CONTENT_EDIT);
    const { contentId } = await params;

    const data = await cmsApi.getContentById(contentId)

    
    return (
        <main className="">
            <div className="container mb-4 mx-auto">
                <h1 className="text-3xl text-primary ">Editando o conteudo {data.title}</h1>
                <SaveButton currentContent={data}  type="update" disabled={false} />
            </div>
            <div className="container mx-auto border rounded-lg border-primary-foreground p-4">
                <SimpleEditor initialContent={data.content} />
            </div>

        </main>
    )
}

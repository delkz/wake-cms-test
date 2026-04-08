import NewContentForm from "@/components/newContentForm/new-content-form"
import { canPublishContent } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/core";
import { requirePermission } from "@/lib/auth/session";


export const dynamic = 'force-dynamic'

export default async function Content({
    searchParams,
}: {
    searchParams: Promise<{ hotsiteId?: string }>
}) {
    const session = await requirePermission(PERMISSIONS.CONTENT_CREATE);
    const resolvedSearchParams = await searchParams;
    
    return (
        <main className="page-wrap px-4 py-12">
            <div className="container mb-4 mx-auto">
                <h1 className="text-3xl text-primary mb-4">Criando um novo conteudo</h1>
                <NewContentForm
                    initialHotsiteId={resolvedSearchParams.hotsiteId ?? ""}
                    canPublish={canPublishContent(session)}
                />
            </div>
        </main>
    )
}

import NewContentForm from "@/components/newContentForm/new-content-form"
import { PERMISSIONS } from "@/lib/auth/core";
import { requirePermission } from "@/lib/auth/session";


export const dynamic = 'force-dynamic'

export default async function Content() {
    await requirePermission(PERMISSIONS.CONTENT_CREATE);
    
    return (
        <main className="">
            <div className="container mb-4 mx-auto">
                <h1 className="text-3xl text-primary mb-4">Criando um novo conteudo</h1>
                <NewContentForm />
            </div>
        </main>
    )
}

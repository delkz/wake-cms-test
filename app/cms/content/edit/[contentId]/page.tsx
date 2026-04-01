import { SimpleEditor } from "@/app/components/tiptap-templates/simple/simple-editor";
import { Button } from "@/app/components/ui/button";
import { cmsApi } from "@/app/lib/cms-api";

export default async function Content({
    params
}: {
    params: Promise<{ contentId: string }>
}) {
    const { contentId } = await params;

    const data = await cmsApi.getContentById(contentId)

    console.log({ data }) // Log para verificar os dados retornados

    
    return (
        <main className="page-wrap px-4 py-12">
            <div className="container mb-4">
                  <h1 className="text-3xl text-primary ">Editando o conteudo {data.title}</h1>
                  <Button>Salvar</Button>
            </div>
            <div className="container mx-auto border rounded-lg border-primary-foreground p-4">
                <SimpleEditor initialContent={data.content} />
            </div>

        </main>
    )
}
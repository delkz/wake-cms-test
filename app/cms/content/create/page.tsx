import NewContentForm from "@/components/newContentForm/new-content-form"


export const dynamic = 'force-dynamic'

export default async function Content() {
    
    return (
        <main className="page-wrap px-4 py-12">
            <div className="container mb-4 mx-auto">
                <h1 className="text-3xl text-primary mb-4">Criando um novo conteudo</h1>
                <NewContentForm />
            </div>
        </main>
    )
}

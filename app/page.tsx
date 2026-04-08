import ListHotsites from "@/components/listHotsites";
import { requireSession } from "@/lib/auth/session";


export default async function Home() {
  await requireSession();

  return (
    <main className="space-y-6">
      <section className="island-shell rounded-md p-6 sm:p-8">
        <p className="island-kicker mb-2">Painel</p>
        <h1 className="display-title mb-3 text-4xl font-bold sm:text-5xl">
          Hotsites
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Acesse os hotsites disponiveis, entre em cada detalhe e siga para edicao, conteudos e
          banners com a mesma navegacao usada no restante do sistema.
        </p>
      </section>

      <ListHotsites />
    </main>
  )

}

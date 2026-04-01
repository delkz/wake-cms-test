'use client'


import { Button } from "@/app/components/ui/button"
import { useHotsites } from "../hooks/use-hotsites"
import Link from "next/link"

const ListHotsites = () => {
const { hotsites, isLoading, error, reload } = useHotsites()
console.log('Hotsites:', hotsites) // Log para verificar os dados retornados
  return (
     <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">Hotsites</p>
        <h1 className="display-title mb-3 text-4xl font-bold sm:text-5xl">
          Todos os hotsites disponiveis
        </h1>

        {isLoading ? (
          <p className="text-(--sea-ink-soft)">Carregando...</p>
        ) : null}

        {error ? (
          <div className="space-y-3">
            <p className="text-red-700">{error}</p>
            <Button
              onClick={reload}
              variant={'outline'}
            >
              Tentar novamente
            </Button>
          </div>
        ) : null}

        {!isLoading && !error ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hotsites.map((hotsite) => (
              <div
                key={hotsite.hotsiteId}
                className="rounded-lg border border-(--chip-line) p-4"
              >
                <h2 className="text-xl font-semibold">
                  {hotsite.nome}
                </h2>
                
                <div className="flex gap-2 mt-4">
                    <Button variant={"default"}><Link href={`/cms/hotsite/${hotsite.hotsiteId}`}>Ver detalhes</Link></Button>
                </div>
              </div>
            ))}

            {hotsites.length === 0 ? (
              <p className="text-(--sea-ink-soft)">Nenhum hotsite encontrado.</p>
            ) : null}
          </div>
        ) : null}
      </section>
  )
}

export default ListHotsites
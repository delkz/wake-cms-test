"use client";


import Link from "next/link";

import { useHotsites } from "@/app/hooks/use-hotsites";
import { Button } from "@/components/ui/button";

const ListHotsites = () => {
  const {
    hotsites,
    page,
    hasNextPage,
    isLoading,
    error,
    reload,
    nextPage,
    previousPage,
    goToFirstPage,
  } = useHotsites();

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="island-kicker mb-2">Hotsites</p>
          <h2 className="display-title text-3xl font-bold sm:text-4xl">
            Todos os hotsites disponiveis
          </h2>
        </div>

        <div className="hidden rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground sm:block">
          Página {page}
        </div>
      </div>

      <div className="flex flex-col gap-3 border border-border bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {hotsites.length > 0
            ? `Exibindo ${hotsites.length} hotsites na página ${page}.`
            : `Nenhum hotsite na página ${page}.`}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={goToFirstPage}
            disabled={isLoading || page <= 1}
            variant="outline"
            size="sm"
          >
            Voltar ao inicio
          </Button>
          <Button
            onClick={previousPage}
            disabled={isLoading || page <= 1}
            variant="outline"
            size="sm"
          >
            Página anterior
          </Button>
          <Button
            onClick={nextPage}
            disabled={isLoading || !hasNextPage}
            variant="outline"
            size="sm"
          >
            Próxima página
          </Button>
        </div>
      </div>

      {isLoading ? <p className="text-muted-foreground">Carregando...</p> : null}

      {error ? (
        <div className="space-y-3 rounded-md border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button onClick={() => void reload()} variant="outline">
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {!isLoading && !error ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {hotsites.map((hotsite) => (
              <article
                key={hotsite.hotsiteId}
                className="flex min-h-45 flex-col justify-between border border-border bg-background p-5"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Hotsite
                      </p>
                      <h3 className="mt-1 text-2xl font-semibold leading-tight">{hotsite.nome}</h3>
                    </div>

                    <div className="rounded-md bg-muted/40 px-2 py-1 text-xs font-medium text-muted-foreground">
                      #{hotsite.hotsiteId}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {hotsite.url ? hotsite.url : 'Sem URL definida'}
                  </p>
                </div>

                <div className="mt-5 flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/cms/hotsite/${hotsite.hotsiteId}`}>Ver detalhes</Link>
                  </Button>
                </div>
              </article>
            ))}

            {hotsites.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum hotsite encontrado nesta página.</p>
            ) : null}
          </div>

        </div>
      ) : null}
    </section>
  );
};

export default ListHotsites;
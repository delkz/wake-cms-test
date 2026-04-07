'use client'

import { useMemo, useState } from "react"
import Link from "next/link"

import { type HotsiteContent } from "@/app/lib/cms-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type HotsiteContentListProps = {
  contents: HotsiteContent[]
  hotsiteId: string
  canEdit: boolean
}

export default function HotsiteContentList({ contents, hotsiteId, canEdit }: HotsiteContentListProps) {
  const [search, setSearch] = useState("")

  const filteredContents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) {
      return contents
    }

    return contents.filter((content) => {
      const safeTitle = String(content.title ?? "")
      const titleMatch = safeTitle.toLowerCase().includes(normalizedSearch)

      const safeSearchTerms = Array.isArray(content.searchTerms)
        ? content.searchTerms.filter(Boolean).join(" ")
        : String(content.searchTerms ?? "")
      const termsMatch = safeSearchTerms.toLowerCase().includes(normalizedSearch)

      return titleMatch || termsMatch
    })
  }, [contents, search])

  return (
    <div>
      <h2 className="text-2xl font-bold mt-4">Conteudos</h2>
      <div className="mb-3 flex gap-2">
        <Input
          name="busca"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar conteudo por titulo ou termo"
        />
      </div>
      <div className="grid mb-4 grid-cols-3 gap-4 max-h-[80dvh] overflow-y-auto">
        {filteredContents.map((content) => (
          <div key={content.contentId} className="rounded-lg border border-primary-foreground hover:border-primary p-4">
            <h3 className="text-xl font-semibold mb-1">{content.title}</h3>
            {canEdit ? (
              <Button asChild>
                <Link href={`/cms/content/edit/${content.contentId}?hotsiteId=${hotsiteId}`}>Editar</Link>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Sem permissão para editar este conteúdo.</p>
            )}
          </div>
        ))}
        {filteredContents.length === 0 ? (
          <p>Nenhum conteudo encontrado para essa busca.</p>
        ) : null}
      </div>
    </div>
  )
}

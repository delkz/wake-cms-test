'use client'

import { useMemo, useState } from "react"
import Link from "next/link"

import { type HotsiteContent } from "@/app/lib/cms-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type HotsiteContentListProps = {
  contents: HotsiteContent[]
  hotsiteId: string
  canEdit: boolean
  canCreate: boolean
}

export default function HotsiteContentList({ contents, hotsiteId, canEdit, canCreate }: HotsiteContentListProps) {
  const [search, setSearch] = useState("")
  const [positionFilter, setPositionFilter] = useState("all")

  const positions = useMemo(() => {
    return Array.from(
      new Set(contents.map((content) => String(content.position ?? "").trim()).filter(Boolean)),
    )
  }, [contents])

  const filteredContents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return contents.filter((content) => {
      const safeTitle = String(content.title ?? "")
      const titleMatch = safeTitle.toLowerCase().includes(normalizedSearch)

      const safeSearchTerms = Array.isArray(content.searchTerms)
        ? content.searchTerms.filter(Boolean).join(" ")
        : String(content.searchTerms ?? "")
      const termsMatch = safeSearchTerms.toLowerCase().includes(normalizedSearch)

      const matchesSearch = !normalizedSearch || titleMatch || termsMatch
      const matchesPosition =
        positionFilter === "all" || String(content.position ?? "").trim() === positionFilter

      return matchesSearch && matchesPosition
    })
  }, [contents, positionFilter, search])

  return (
    <div>
        <div className="mt-4 mb-3 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Conteudos</h2>
        {canCreate ? (
            <Button  type="button"
            variant="outline" asChild>
            <Link href={`/cms/content/create?hotsiteId=${hotsiteId}`}>Novo Conteudo</Link>
          </Button>
        ) : null}
      </div>
      <div className="mb-3 flex gap-2">
        <Input
          name="busca"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar conteudo por titulo ou termo"
        />
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filtrar por posicao" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as posicoes</SelectItem>
            {positions.map((position) => (
              <SelectItem key={position} value={position}>
                {position}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid mb-4 grid-cols-3 gap-4 max-h-[80dvh] overflow-y-auto">
        {filteredContents.map((content) => (
          <div key={content.contentId} className="rounded-lg border border-primary-foreground hover:border-primary p-4">
            <h3 className="text-xl font-semibold mb-1">{content.title}</h3>
            <p className="mb-3 text-sm font-light text-primary">{content.position}</p>
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

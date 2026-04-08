import { requestGraphql, requestRest } from "./http"
import type { Hotsite, HotsiteBanner, HotsiteContent } from "./types"

type HotsiteMutationInput = {
  hotsiteId?: string
  nome: string
  url: string
  ativo: boolean
}

type ListHotsitesOptions = {
  page?: number
  quantityPerPage?: number
}

type HotsiteGraphqlResponse = {
  hotsite?: {
    hotsiteId: string | number
    url?: string
    name: string
    contents: HotsiteContent[]
    banners: HotsiteBanner[]
  }
}

function buildHotsitesListPath(options: ListHotsitesOptions = {}): string {
  const searchParams = new URLSearchParams()

  searchParams.set('pagina', String(options.page ?? 1))
  searchParams.set('quantidadePorPagina', String(options.quantityPerPage ?? 9))

  return `/hotsites?${searchParams.toString()}`
}

export async function listHotsites(options: ListHotsitesOptions = {}): Promise<Hotsite[]> {
  return requestRest<Hotsite[]>(buildHotsitesListPath(options), 'GET')
}

export async function getHotsiteById(hotsiteId: string): Promise<Hotsite> {
  const data = await requestGraphql<HotsiteGraphqlResponse>(
    `
    query($hotsiteId: Long) {
      hotsite(hotsiteId: $hotsiteId) {
        hotsiteId
        url
        name
        contents {
          contentId
          content
          title
          position
        }
        banners {
          bannerId
          bannerName
          bannerUrl
          position
        }
      }
    }
    `,
    { hotsiteId: Number(hotsiteId) }
  )

  if (!data?.hotsite) {
    throw new Error('Hotsite nao encontrado')
  }

  return {
    nome: data.hotsite.name,
    ativo: true,
    banners: data.hotsite.banners,
    conteudos: data.hotsite.contents,
    hotsiteId: String(data.hotsite.hotsiteId),
    url: data.hotsite.url ?? '',
  }
}

export async function createHotsite(input: {
  name: string
  slug: string
}): Promise<Hotsite> {
  return requestRest<Hotsite>('/hotsites', 'POST', input)
}

export async function removeHotsite(hotsiteId: string): Promise<void> {
  return requestRest<void>(`/hotsites/${hotsiteId}`, 'DELETE')
}

export async function insertHotsite(input: HotsiteMutationInput): Promise<Hotsite> {
  console.log("nao implementado")
  return {
    ativo: input.ativo,
    banners: [],
    conteudos: [],
    hotsiteId: input.hotsiteId ?? "",
    nome: input.nome,
    url: input.url,
  }
}

export async function updateHotsite(input: HotsiteMutationInput): Promise<Hotsite> {
  console.log("nao implementado")
  return {
    ativo: input.ativo,
    banners: [],
    conteudos: [],
    hotsiteId: input.hotsiteId ?? "",
    nome: input.nome,
    url: input.url,
  }
}

export async function deleteHotsite(hotsiteId: string): Promise<void> {
  console.log("nao implementado")
  console.log(hotsiteId)
}

export async function updateHotsiteContents(
  hotsiteId: string,
  contents: HotsiteContent[],
): Promise<HotsiteContent[]> {
  return requestRest<HotsiteContent[]>(`/hotsites/${hotsiteId}/contents`, 'PUT', {
    contents,
  })
}

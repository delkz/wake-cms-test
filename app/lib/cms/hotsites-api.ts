import { requestGraphql, requestRest } from "./http"
import type { Hotsite, HotsiteBanner, HotsiteContent } from "./types"

type HotsiteGraphqlResponse = {
  hotsite?: {
    hotsiteId: string | number
    name: string
    contents: HotsiteContent[]
    banners: HotsiteBanner[]
  }
}

export async function listHotsites(): Promise<Hotsite[]> {
  return requestRest<Hotsite[]>('/hotsites', 'GET')
}

export async function getHotsiteById(hotsiteId: string): Promise<Hotsite> {
  const data = await requestGraphql<HotsiteGraphqlResponse>(
    `
    query($hotsiteId: Long) {
      hotsite(hotsiteId: $hotsiteId) {
        hotsiteId
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
    url: '',
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

export async function updateHotsiteContents(
  hotsiteId: string,
  contents: HotsiteContent[],
): Promise<HotsiteContent[]> {
  return requestRest<HotsiteContent[]>(`/hotsites/${hotsiteId}/contents`, 'PUT', {
    contents,
  })
}

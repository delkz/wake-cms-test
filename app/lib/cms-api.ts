import { getContentByIdResponseSuccess, RestErrorResponse } from "../types/rest"

export interface Hotsite {
  ativo: boolean
  hotsiteId: string
  banners: HotsiteBanner[]
  conteudos: HotsiteContent[]
  url: string,
  nome: string
}

export interface HotsiteContent {
  contentId: string
  content: string
  title: string
  searchTerms: string[] | string
  position: string
  hotsiteId?: string | number[]
  exibeTodasBuscas?: boolean,
  naoExibeBuscas?: boolean,
  exibeTodosHotsites?: boolean,
}

export interface HotsiteBanner {
  bannerId: string
  bannerName: string
  bannerUrl: string
}

// API routes locais (seguras, token no servidor)
const REST_API_ROUTE = '/api/rest'
const CACHE_TTL_MS = 60_000

type CacheEntry<T> = {
  data: T
  expiresAt: number
}

const restCache = new Map<string, CacheEntry<unknown>>()
const graphqlCache = new Map<string, CacheEntry<unknown>>()

function getRestApiUrl(): string {
  if (typeof window !== 'undefined') {
    return new URL(REST_API_ROUTE, window.location.origin).toString()
  }

  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL

  if (configuredOrigin) {
    const normalizedOrigin = configuredOrigin.startsWith('http')
      ? configuredOrigin
      : `https://${configuredOrigin}`

    return new URL(REST_API_ROUTE, normalizedOrigin).toString()
  }

  return new URL(REST_API_ROUTE, 'http://localhost:3000').toString()
}

function getGraphqlApiUrl(): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL


  if (configuredOrigin) {    
    const normalizedOrigin = configuredOrigin.startsWith('http')
      ? configuredOrigin
      : `https://${configuredOrigin}`

    return new URL('/api/graphql', normalizedOrigin).toString()
  }

  return new URL('/api/graphql', 'http://localhost:3000').toString()
}

function buildCacheKey(input: unknown): string {
  return JSON.stringify(input)
}

function getCachedValue<T>(
  cache: Map<string, CacheEntry<unknown>>,
  key: string,
): T | null {
  const entry = cache.get(key)
  if (!entry) {
    return null
  }

  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }

  return entry.data as T
}

function setCachedValue<T>(
  cache: Map<string, CacheEntry<unknown>>,
  key: string,
  data: T,
): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })
}

async function requestRest<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const shouldUseCache = method === 'GET' && body === undefined
  const cacheKey = buildCacheKey({ path, method })

  if (shouldUseCache) {
    const cached = getCachedValue<T>(restCache, cacheKey)
    if (cached !== null) {
      return cached
    }
  }

  const request: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  if (method !== 'GET' && body !== undefined) {
    request.body = JSON.stringify({ path, method, body })
  }

  let restApiUrl = getRestApiUrl()

  if (method === 'GET') {
    const searchParams = new URLSearchParams({
      path,
      method,
    })
    restApiUrl = `${restApiUrl}?${searchParams.toString()}`
  }

  const response = await fetch(restApiUrl, request)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `Erro REST (${response.status})` }))
    throw new Error(error.error || `Erro REST (${response.status})`)
  }

  if (response.status === 204) {
    if (!shouldUseCache) {
      restCache.clear()
      graphqlCache.clear()
    }
    return undefined as T
  }

  const data = (await response.json()) as T

  if (shouldUseCache) {
    setCachedValue(restCache, cacheKey, data)
  } else {
    restCache.clear()
    graphqlCache.clear()
  }

  return data
}

async function requestQl<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(getGraphqlApiUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `Erro GraphQL (${response.status})` }))
    throw new Error(error.error || `Erro GraphQL (${response.status})`)
  }

  const payload = (await response.json()) as { data?: T; errors?: Array<{ message?: string }> }

  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message || 'Erro GraphQL')
  }

  if (payload.data === undefined) {
    throw new Error('Resposta GraphQL sem data')
  }

  return payload.data
}

export const cmsApi = {
  async listHotsites(): Promise<Hotsite[]> {
    return requestRest<Hotsite[]>('/hotsites', 'GET')
  },

  async getHotsiteById(hotsiteId: string): Promise<Hotsite> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await requestQl<any>(`
    query($hotsiteId: Long) {
      hotsite(hotsiteId: $hotsiteId) {
        hotsiteId
        name
        contents {
          contentId
          content
          title
        }
        banners {
          bannerId
          bannerName
          bannerUrl
        }
      }
    }

    `, { hotsiteId:Number(hotsiteId) })
    
    if(!data || !data.hotsite) {
      throw new Error('Hotsite não encontrado')
    }
    console.log('GraphQL Hotsite Data:', data) // Log para verificar os dados retornados

    return {
      nome: data.hotsite.name,
      ativo: true,
      banners: data.hotsite.banners,
      conteudos: data.hotsite.contents,
      hotsiteId: String(data.hotsite.hotsiteId),
      url: ''
    }
  },
  async updateContent(input: HotsiteContent): Promise<HotsiteContent> {
    const { contentId, content, title, position, hotsiteId, searchTerms, exibeTodasBuscas, naoExibeBuscas, exibeTodosHotsites } = input

    // console.log({ input })

    

    return requestRest<HotsiteContent>(`/conteudos/${contentId}`, 'PUT', {
      titulo: title,
      ativo: true,
      posicionamento: position,
      conteudo: content,
      exibeTodasBuscas: exibeTodasBuscas,
      naoExibeBuscas: naoExibeBuscas,
      exibeTodosHotsites: exibeTodosHotsites,
      termosBusca: searchTerms,
      hotsitesId: hotsiteId,
    })

  },
  async getContentById(contentId: string): Promise<HotsiteContent> {

    const data: getContentByIdResponseSuccess | RestErrorResponse = await requestRest(`/conteudos/${contentId}`, 'GET');
    

    function isRestErrorResponse(
      value: getContentByIdResponseSuccess | RestErrorResponse,
    ): value is RestErrorResponse {
      return "mensagem" in value
    }

    if(!data || isRestErrorResponse(data)) {
      throw new Error('Conteúdo não encontrado')
    }
    

    return {
      contentId: String(data.conteudoId),
      content: data.codigoFonte,
      title: data.titulo,
      searchTerms: data.termoBusca,
      position: data.posicionamento ?? '',
      exibeTodasBuscas: data.exibeTodasBuscas,
      naoExibeBuscas: data.naoExibeBuscas,
      exibeTodosHotsites: data.exibeTodosHotsites,
      hotsiteId: data.hotsitesId,
    }
  },
  async createHotsite(input: { name: string; slug: string }): Promise<Hotsite> {
    return requestRest<Hotsite>('/hotsites', 'POST', input)
  },

  async removeHotsite(hotsiteId: string): Promise<void> {
    return requestRest<void>(`/hotsites/${hotsiteId}`, 'DELETE')
  },

  async updateHotsiteContents(
    hotsiteId: string,
    contents: HotsiteContent[],
  ): Promise<HotsiteContent[]> {
    return requestRest<HotsiteContent[]>(`/hotsites/${hotsiteId}/contents`, 'PUT', {
      contents,
    })
  },

  async updateHotsiteBanners(
    hotsiteId: string,
    banners: HotsiteBanner[],
  ): Promise<HotsiteBanner[]> {
    return requestRest<HotsiteBanner[]>(`/hotsites/${hotsiteId}/banners`, 'PUT', {
      banners,
    })
  },

  async replaceHotsiteUrlBinding(
    url: string,
    hotsiteId: string,
  ): Promise<{ url: string; hotsiteId: string; updatedAt: string }> {
    return requestRest<{ url: string; hotsiteId: string; updatedAt: string }>(
      '/url-bindings',
      'PUT',
      {
        url,
        hotsiteId,
      },
    )
  },
}
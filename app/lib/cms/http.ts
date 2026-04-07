const REST_API_ROUTE = '/api/rest'
const GRAPHQL_API_ROUTE = '/api/graphql'
const CACHE_TTL_MS = 60_000

type CacheEntry<T> = {
  data: T
  expiresAt: number
}

const restCache = new Map<string, CacheEntry<unknown>>()
const graphqlCache = new Map<string, CacheEntry<unknown>>()

function isServerEnvironment(): boolean {
  return typeof window === 'undefined'
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`${name} nao configurada`)
  }

  return value
}

function getWakeRestBaseUrl(): string {
  const baseUrl = getRequiredEnv('WAKE_API_URL')
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

function getWakeGraphqlBaseUrl(): string {
  const baseUrl = getRequiredEnv('WAKE_GRAPHQL_URL')
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

function getWakeRestHeaders(): HeadersInit {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Basic ${getRequiredEnv('WAKE_API_TOKEN')}`,
  }
}

function getWakeGraphqlHeaders(): HeadersInit {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'TCS-Access-Token': getRequiredEnv('WAKE_GRAPHQL_TOKEN'),
  }
}

function getRestApiUrl(): string {
  if (!isServerEnvironment()) {
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

    return new URL(GRAPHQL_API_ROUTE, normalizedOrigin).toString()
  }

  return new URL(GRAPHQL_API_ROUTE, 'http://localhost:3000').toString()
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

function clearCaches(): void {
  restCache.clear()
  graphqlCache.clear()
}

export async function requestRest<T>(
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

  if (isServerEnvironment()) {
    const response = await fetch(`${getWakeRestBaseUrl()}${path}`, {
      method,
      headers: getWakeRestHeaders(),
      body: method !== 'GET' && body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    })

    if (!response.ok) {
      const error = await response.text().catch(() => `Erro REST (${response.status})`)
      throw new Error(error || `Erro REST (${response.status})`)
    }

    if (response.status === 204) {
      if (!shouldUseCache) {
        clearCaches()
      }
      return undefined as T
    }

    const data = (await response.json()) as T

    if (shouldUseCache) {
      setCachedValue(restCache, cacheKey, data)
    } else {
      clearCaches()
    }

    return data
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
      clearCaches()
    }
    return undefined as T
  }

  const data = (await response.json()) as T

  if (shouldUseCache) {
    setCachedValue(restCache, cacheKey, data)
  } else {
    clearCaches()
  }

  return data
}

export async function requestGraphql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const cacheKey = buildCacheKey({ query, variables })

  if (!isServerEnvironment()) {
    const cached = getCachedValue<T>(graphqlCache, cacheKey)
    if (cached !== null) {
      return cached
    }
  }

  const response = await fetch(
    isServerEnvironment() ? getWakeGraphqlBaseUrl() : getGraphqlApiUrl(),
    {
      method: 'POST',
      headers: isServerEnvironment()
        ? getWakeGraphqlHeaders()
        : {
            'Content-Type': 'application/json',
          },
      body: JSON.stringify({
        query,
        variables,
      }),
      cache: isServerEnvironment() ? 'no-store' : 'default',
    }
  )

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

  if (!isServerEnvironment()) {
    setCachedValue(graphqlCache, cacheKey, payload.data)
  }

  return payload.data
}

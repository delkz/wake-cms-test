import { useCallback, useEffect, useState } from 'react'

import { cmsApi, type Hotsite } from '@/app/lib/cms-api'

const DEFAULT_PAGE_SIZE = 50

export function useHotsites() {
  const [hotsites, setHotsites] = useState<Hotsite[]>([])
  const [page, setPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async (pageToLoad = 1) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await cmsApi.listHotsites({
        page: pageToLoad,
        quantityPerPage: DEFAULT_PAGE_SIZE,
      })

      setHotsites(data)
      setPage(pageToLoad)
      setHasNextPage(data.length === DEFAULT_PAGE_SIZE)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar hotsites'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload(1)
  }, [reload])

  const nextPage = useCallback(() => {
    if (isLoading || !hasNextPage) {
      return
    }

    void reload(page + 1)
  }, [hasNextPage, isLoading, page, reload])

  const previousPage = useCallback(() => {
    if (isLoading || page <= 1) {
      return
    }

    void reload(page - 1)
  }, [isLoading, page, reload])

  const goToFirstPage = useCallback(() => {
    if (isLoading || page === 1) {
      return
    }

    void reload(1)
  }, [isLoading, page, reload])

  return {
    hotsites,
    page,
    hasNextPage,
    isLoading,
    error,
    reload,
    nextPage,
    previousPage,
    goToFirstPage,
  }
}
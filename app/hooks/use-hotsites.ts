import { useCallback, useEffect, useState } from 'react'

import { cmsApi, type Hotsite } from '@/app/lib/cms-api'

export function useHotsites() {
  const [hotsites, setHotsites] = useState<Hotsite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function getHotsiteById(id: string) {
    
  }

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await cmsApi.listHotsites()
      setHotsites(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar hotsites'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return {
    hotsites,
    isLoading,
    error,
    reload,
    getHotsiteById
  }
}
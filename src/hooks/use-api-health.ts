import { useEffect, useState } from 'react'

import { getHealth } from '@/lib/api'

export type ApiHealthStatus = 'checking' | 'ok' | 'error'

export function useApiHealth(): ApiHealthStatus {
  const [status, setStatus] = useState<ApiHealthStatus>('checking')

  useEffect(() => {
    const controller = new AbortController()

    getHealth(controller.signal)
      .then(() => setStatus('ok'))
      .catch(() => {
        if (!controller.signal.aborted) {
          setStatus('error')
        }
      })

    return () => controller.abort()
  }, [])

  return status
}

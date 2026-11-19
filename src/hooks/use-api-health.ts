import { useEffect, useState } from 'react'

import { health, unwrap } from '@/lib/api'

export type ApiHealthStatus = 'checking' | 'ok' | 'error'

export function useApiHealth(): ApiHealthStatus {
  const [status, setStatus] = useState<ApiHealthStatus>('checking')

  useEffect(() => {
    const controller = new AbortController()

    unwrap(health({ signal: controller.signal }))
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

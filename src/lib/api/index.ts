import { client } from './generated/client.gen'
import { ApiError } from '../errors'

// Development: Vite proxies `/api`. Production: the API and the SPA share an
// origin, so relative paths reach the same server.
client.setConfig({
  baseUrl:
    import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '/api' : ''),
})

// Типы и функции вызова генерируются из OpenAPI-контракта (@hey-api/openapi-ts).
export * from './generated/sdk.gen'
export * from './generated/types.gen'

type SdkResult<T> = {
  data?: T
  error?: unknown
  response?: Response
}

/** Возвращает данные ответа или бросает `ApiError`, нормализуя тело ошибки API. */
export async function unwrap<T>(result: Promise<SdkResult<T>>): Promise<T> {
  const { data, error, response } = await result

  if (error || data === undefined) {
    throw toApiError(error, response)
  }

  return data
}

function toApiError(error: unknown, response?: Response) {
  const body = error as
    | {
        error?: {
          code?: string
          message?: string
          details?: Record<string, string>
        }
      }
    | undefined

  return new ApiError(
    body?.error?.message ?? 'Не удалось выполнить запрос',
    response?.status ?? 0,
    body?.error?.code,
    body?.error?.details,
  )
}

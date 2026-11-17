import createClient from 'openapi-fetch'

import type { paths } from './schema'

/** Типизированный клиент, сгенерированный из OpenAPI-контракта. */
export function createApiClient(baseUrl: string) {
  return createClient<paths>({ baseUrl })
}

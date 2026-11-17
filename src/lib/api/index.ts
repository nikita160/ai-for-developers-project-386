import { createApiClient } from './client'

export const api = createApiClient(import.meta.env.VITE_API_BASE_URL ?? '/api')

export async function getHealth() {
  const { data, error, response } = await api.GET('/health')

  if (error) {
    throw new Error(`Health check failed with status ${response.status}`)
  }

  return data
}

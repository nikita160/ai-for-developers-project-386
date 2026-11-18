import { ApiError } from '../errors'
import { createApiClient } from './client'
import type { components } from './schema'

export type MeetingType = components['schemas']['MeetingType']
export type AvailabilityDay = components['schemas']['AvailabilityDay']
export type Slot = components['schemas']['Slot']
export type Booking = components['schemas']['Booking']
export type BookingRequest = components['schemas']['BookingRequest']

// Development: Vite proxies `/api`. Production: the API and the SPA share an
// origin, so relative paths reach the same server.
export const api = createApiClient(
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '/api' : ''),
)

export async function getHealth(signal?: AbortSignal) {
  return unwrap(await api.GET('/health', { signal }))
}

export async function getMeetingTypes(signal?: AbortSignal) {
  return unwrap(await api.GET('/meeting-types', { signal }))
}

export async function getAvailability(typeId: string, signal?: AbortSignal) {
  return unwrap(
    await api.GET('/availability', {
      params: { query: { type: typeId } },
      signal,
    }),
  )
}

export async function getSlots(
  typeId: string,
  date: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/slots', {
      params: { query: { type: typeId, date } },
      signal,
    }),
  )
}

export async function createBooking(input: BookingRequest) {
  return unwrap(await api.POST('/bookings', { body: input }))
}

export async function getUpcomingBookings(signal?: AbortSignal) {
  return unwrap(
    await api.GET('/bookings', {
      params: { query: { upcoming: true } },
      signal,
    }),
  )
}

async function unwrap<T>(result: {
  data?: T
  error?: unknown
  response: Response
}): Promise<T> {
  if (result.error || result.data === undefined) {
    throw toApiError(result.error, result.response)
  }

  return result.data
}

function toApiError(error: unknown, response: Response) {
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
    response.status,
    body?.error?.code,
    body?.error?.details,
  )
}

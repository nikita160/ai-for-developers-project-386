import { createApiClient } from './client'
import type { components } from './schema'

export type MeetingType = components['schemas']['MeetingType']
export type AvailabilityDay = components['schemas']['AvailabilityDay']
export type Slot = components['schemas']['Slot']
export type Booking = components['schemas']['Booking']
export type BookingRequest = components['schemas']['BookingRequest']

export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export const api = createApiClient(import.meta.env.VITE_API_BASE_URL ?? '/api')

export async function getHealth(signal?: AbortSignal) {
  const { data, error, response } = await api.GET('/health', { signal })

  if (error || !data) {
    throw toApiError(error, response)
  }

  return data
}

export async function getMeetingTypes(signal?: AbortSignal) {
  const { data, error, response } = await api.GET('/meeting-types', { signal })

  if (error || !data) {
    throw toApiError(error, response)
  }

  return data
}

export async function getAvailability(typeId: string, signal?: AbortSignal) {
  const { data, error, response } = await api.GET('/availability', {
    params: { query: { type: typeId } },
    signal,
  })

  if (error || !data) {
    throw toApiError(error, response)
  }

  return data
}

export async function getSlots(
  typeId: string,
  date: string,
  signal?: AbortSignal,
) {
  const { data, error, response } = await api.GET('/slots', {
    params: { query: { type: typeId, date } },
    signal,
  })

  if (error || !data) {
    throw toApiError(error, response)
  }

  return data
}

export async function createBooking(input: BookingRequest) {
  const { data, error, response } = await api.POST('/bookings', { body: input })

  if (error || !data) {
    throw toApiError(error, response)
  }

  return data
}

export async function getUpcomingBookings(signal?: AbortSignal) {
  const { data, error, response } = await api.GET('/bookings', {
    params: { query: { upcoming: true } },
    signal,
  })

  if (error || !data) {
    throw toApiError(error, response)
  }

  return data
}

function toApiError(error: unknown, response: Response) {
  const body = error as
    | { error?: { code?: string; message?: string } }
    | undefined

  return new ApiError(
    body?.error?.message ?? 'Не удалось выполнить запрос',
    response.status,
    body?.error?.code,
  )
}

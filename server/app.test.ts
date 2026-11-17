import type { AddressInfo } from 'node:net'
import { readFile } from 'node:fs/promises'

import { serve } from '@hono/node-server'
import Ajv from 'ajv'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { parse } from 'yaml'

import { createApiClient } from '../src/lib/api/client'
import { createApp } from './app'
import { InMemoryBookingStore } from './store'

type OpenApiSpec = {
  paths: Record<string, unknown>
  components: { schemas: Record<string, unknown> }
}

const CONTRACT_URL = new URL('../contract/openapi.yaml', import.meta.url)
const NOW = new Date('2026-11-17T10:00:00+03:00')

let server: ReturnType<typeof serve>
let baseUrl: string
let store: InMemoryBookingStore
let spec: OpenApiSpec

beforeAll(async () => {
  spec = parse(await readFile(CONTRACT_URL, 'utf8')) as OpenApiSpec
  store = new InMemoryBookingStore()

  const app = createApp({ store, now: () => NOW })

  await new Promise<void>((resolve) => {
    server = serve({ fetch: app.fetch, port: 0 }, (info) => {
      baseUrl = `http://127.0.0.1:${(info as AddressInfo).port}`
      resolve()
    })
  })
})

beforeEach(() => {
  store.clear()
})

afterAll(() => {
  server.close()
})

function validateAgainstContract(component: string, body: unknown) {
  const ajv = new Ajv({ strict: false })
  ajv.addSchema(spec as object, 'openapi')
  const validate = ajv.compile({
    $ref: `openapi#/components/schemas/${component}`,
  })

  expect(validate(body), JSON.stringify(validate.errors)).toBe(true)
}

async function getJson<T = unknown>(path: string) {
  const response = await fetch(`${baseUrl}${path}`)
  return { response, body: (await response.json()) as T }
}

function postBooking(body: unknown) {
  return fetch(`${baseUrl}/bookings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBooking = {
  typeId: 'call',
  start: '2026-11-18T09:00:00+03:00',
  name: 'Иван',
  email: 'ivan@example.com',
}

describe('smoke', () => {
  it('starts the app and responds on GET /health', async () => {
    const { response, body } = await getJson('/health')

    expect(response.status).toBe(200)
    expect(body).toEqual({ status: 'ok' })
  })

  it('responds through the generated SDK client', async () => {
    const client = createApiClient(baseUrl)
    const { data, response } = await client.GET('/health')

    expect(response.status).toBe(200)
    expect(data).toEqual({ status: 'ok' })
  })
})

describe('contract', () => {
  it('exposes every path described in the OpenAPI contract', () => {
    expect(Object.keys(spec.paths).sort()).toEqual([
      '/availability',
      '/bookings',
      '/health',
      '/meeting-types',
      '/slots',
    ])
  })

  it('returns a health response matching the OpenAPI schema', async () => {
    const { body } = await getJson('/health')

    validateAgainstContract('HealthStatus', body)
  })
})

describe('meeting types', () => {
  it('lists the call and consultation types', async () => {
    const { response, body } = await getJson<unknown[]>('/meeting-types')

    expect(response.status).toBe(200)
    expect(body).toHaveLength(2)
    body.forEach((item: unknown) => validateAgainstContract('MeetingType', item))
  })
})

describe('availability', () => {
  it('returns 14 days with free starts for the selected type', async () => {
    const { response, body } = await getJson<
      Array<{ date: string; freeStarts: number }>
    >('/availability?type=call')

    expect(response.status).toBe(200)
    expect(body).toHaveLength(14)
    expect(body[0]).toEqual({ date: '2026-11-18', freeStarts: 18 })
    body.forEach((item: unknown) =>
      validateAgainstContract('AvailabilityDay', item),
    )
  })

  it('rejects an unknown meeting type', async () => {
    const { response, body } = await getJson('/availability?type=webinar')

    expect(response.status).toBe(400)
    expect(body).toEqual({
      error: expect.objectContaining({ code: 'validation_error' }),
    })
    validateAgainstContract('ErrorResponse', body)
  })
})

describe('slots', () => {
  it('returns the starts of a day for the selected type', async () => {
    const { response, body } = await getJson<
      Array<{ start: string; end: string; available: boolean }>
    >('/slots?type=call&date=2026-11-18')

    expect(response.status).toBe(200)
    expect(body).toHaveLength(18)
    expect(body[0]).toEqual({
      start: '2026-11-18T09:00:00+03:00',
      end: '2026-11-18T09:30:00+03:00',
      available: true,
    })
    body.forEach((item: unknown) => validateAgainstContract('Slot', item))
  })

  it('rejects dates outside the booking window', async () => {
    const { response, body } = await getJson(
      '/slots?type=call&date=2026-11-17',
    )

    expect(response.status).toBe(400)
    expect(body).toEqual({
      error: expect.objectContaining({ code: 'date_out_of_window' }),
    })
    validateAgainstContract('ErrorResponse', body)
  })
})

describe('bookings', () => {
  it('creates a booking and lists it as upcoming', async () => {
    const response = await postBooking(validBooking)
    const body = (await response.json()) as { id: string }

    expect(response.status).toBe(201)
    validateAgainstContract('Booking', body)

    const upcoming = await getJson<Array<Record<string, unknown>>>(
      '/bookings?upcoming=true',
    )

    expect(upcoming.response.status).toBe(200)
    expect(upcoming.body).toHaveLength(1)
    expect(upcoming.body[0]).toEqual(
      expect.objectContaining({ id: body.id, typeId: 'call', name: 'Иван' }),
    )
    upcoming.body.forEach((item: unknown) =>
      validateAgainstContract('Booking', item),
    )
  })

  it('lists upcoming bookings in start order and hides past ones', async () => {
    store.add({
      id: 'past',
      typeId: 'call',
      start: new Date('2026-11-16T09:00:00+03:00'),
      end: new Date('2026-11-16T09:30:00+03:00'),
      name: 'Прошлый',
      email: 'past@example.com',
      createdAt: NOW,
    })
    store.add({
      id: 'later',
      typeId: 'call',
      start: new Date('2026-11-17T11:00:00+03:00'),
      end: new Date('2026-11-17T11:30:00+03:00'),
      name: 'Позже',
      email: 'later@example.com',
      createdAt: NOW,
    })
    store.add({
      id: 'in-progress',
      typeId: 'call',
      start: new Date('2026-11-17T09:45:00+03:00'),
      end: new Date('2026-11-17T10:15:00+03:00'),
      name: 'Идёт',
      email: 'now@example.com',
      createdAt: NOW,
    })

    const { response, body } = await getJson<Array<{ id: string }>>(
      '/bookings',
    )

    expect(response.status).toBe(200)
    expect(body.map((item) => item.id)).toEqual(['in-progress', 'later'])
  })

  it('rejects a slot that is already taken', async () => {
    await postBooking(validBooking)
    const response = await postBooking(validBooking)

    expect(response.status).toBe(409)
    const body = await response.json()

    expect(body).toEqual({
      error: expect.objectContaining({ code: 'slot_taken' }),
    })
    validateAgainstContract('ErrorResponse', body)
  })

  it('rejects invalid contact details', async () => {
    const response = await postBooking({
      ...validBooking,
      email: 'not-an-email',
    })

    expect(response.status).toBe(400)
    const body = await response.json()

    expect(body).toEqual({
      error: expect.objectContaining({ code: 'validation_error' }),
    })
    validateAgainstContract('ErrorResponse', body)
  })

  it('rejects malformed request bodies', async () => {
    const response = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"typeId":',
    })

    expect(response.status).toBe(400)
    const body = await response.json()

    expect(body).toEqual({
      error: expect.objectContaining({ code: 'validation_error' }),
    })
    validateAgainstContract('ErrorResponse', body)
  })
})

describe('concurrency', () => {
  it('lets only one of two simultaneous requests book the same slot', async () => {
    const start = '2026-11-18T11:00:00+03:00'

    const responses = await Promise.all([
      postBooking({ ...validBooking, start }),
      postBooking({ ...validBooking, start }),
    ])

    expect(responses.map((response) => response.status).sort()).toEqual([
      201, 409,
    ])
    expect(store.list()).toHaveLength(1)
  })
})

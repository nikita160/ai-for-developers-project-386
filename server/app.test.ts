import type { AddressInfo } from 'node:net'
import { readFile } from 'node:fs/promises'

import { serve } from '@hono/node-server'
import Ajv from 'ajv'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { parse } from 'yaml'

import { createApiClient } from '../src/lib/api/client'
import { app } from './app'

type OpenApiSpec = {
  paths: Record<string, unknown>
  components: { schemas: Record<string, unknown> }
}

const CONTRACT_URL = new URL('../contract/openapi.yaml', import.meta.url)

let server: ReturnType<typeof serve>
let baseUrl: string
let spec: OpenApiSpec

beforeAll(async () => {
  spec = parse(await readFile(CONTRACT_URL, 'utf8')) as OpenApiSpec

  await new Promise<void>((resolve) => {
    server = serve({ fetch: app.fetch, port: 0 }, (info) => {
      baseUrl = `http://127.0.0.1:${(info as AddressInfo).port}`
      resolve()
    })
  })
})

afterAll(() => {
  server.close()
})

describe('smoke', () => {
  it('starts the app and responds on GET /health', async () => {
    const response = await fetch(`${baseUrl}/health`)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'ok' })
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
    expect(Object.keys(spec.paths)).toContain('/health')
  })

  it('returns a response matching the OpenAPI schema', async () => {
    const schema = spec.components.schemas.HealthStatus
    const validate = new Ajv({ strict: false }).compile(schema)

    const response = await fetch(`${baseUrl}/health`)
    const body = await response.json()

    expect(validate(body), JSON.stringify(validate.errors)).toBe(true)
  })
})

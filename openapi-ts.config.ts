import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: { path: './contract/openapi.yaml' },
  output: 'src/lib/api/generated',
  client: '@hey-api/client-fetch',
  plugins: ['@hey-api/typescript', '@hey-api/sdk'],
})

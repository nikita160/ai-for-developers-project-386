import path from 'node:path'
import { existsSync } from 'node:fs'

import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'

import { app } from './app'

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001)
const distDir = path.resolve(process.env.STATIC_DIR ?? 'dist')

// In production the same process serves the built SPA, so the browser talks to
// the API on its own origin. In development Vite serves the SPA and proxies
// `/api` here, where `dist` may be missing or stale.
if (existsSync(path.join(distDir, 'index.html'))) {
  app.use('*', serveStatic({ root: distDir }))
  app.get('*', serveStatic({ path: path.join(distDir, 'index.html') }))
}

serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
  console.log(`API listening on http://0.0.0.0:${info.port}`)
})

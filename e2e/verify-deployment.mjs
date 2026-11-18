// Checks a deployed instance over its public URL: a booking is created, it
// appears in the owner's upcoming list, and an overlapping booking is rejected.
const baseUrl = (process.env.BASE_URL ?? '').replace(/\/$/, '')

if (!baseUrl) {
  throw new Error('BASE_URL is required')
}

async function request(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init)
  const body = await response.json()

  return { status: response.status, body }
}

function log(step, detail) {
  console.log(`${step}: ${detail}`)
}

async function waitForHealth() {
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    try {
      const { status, body } = await request('/health')
      if (status === 200 && body.status === 'ok') {
        log('health', 'ok')
        return
      }
    } catch (error) {
      log(`health ${attempt}`, String(error))
    }
    await new Promise((resolve) => setTimeout(resolve, 10_000))
  }

  throw new Error('service did not become healthy')
}

async function main() {
  await waitForHealth()

  const page = await fetch(`${baseUrl}/`)
  if (!page.ok || !(await page.text()).includes('<div id="root">')) {
    throw new Error('SPA index.html is not served')
  }
  log('spa', 'index.html served')

  const days = (await request('/availability?type=call')).body
  const day = days.find((candidate) => candidate.freeStarts > 2)
  if (!day) {
    throw new Error('no day with free slots')
  }

  const slots = (await request(`/slots?type=call&date=${day.date}`)).body
  const free = slots.filter((slot) => slot.available)
  const name = `Проверка деплоя ${Date.now()}`

  let booking
  let slot

  for (const candidate of free) {
    const result = await request('/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        typeId: 'call',
        start: candidate.start,
        name,
        email: 'deploy-check@example.com',
      }),
    })

    if (result.status === 201) {
      booking = result.body
      slot = candidate
      break
    }

    if (result.status !== 409) {
      throw new Error(`booking failed: ${result.status} ${JSON.stringify(result.body)}`)
    }
  }

  if (!booking) {
    throw new Error('no free slot could be booked')
  }

  log('booking', `${booking.start} ${booking.id}`)

  const upcoming = (await request('/bookings?upcoming=true')).body
  if (!upcoming.some((candidate) => candidate.id === booking.id && candidate.name === name)) {
    throw new Error('booking is missing from the upcoming list')
  }
  log('upcoming list', 'booking is visible to the owner')

  const overlap = await request('/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      typeId: 'consultation',
      start: slot.start,
      name: 'Пересечение',
      email: 'overlap@example.com',
    }),
  })

  if (overlap.status !== 409 || overlap.body.error?.code !== 'slot_taken') {
    throw new Error(`overlap was not rejected: ${overlap.status} ${JSON.stringify(overlap.body)}`)
  }
  log('overlap', 'rejected with 409 slot_taken')
}

await main()

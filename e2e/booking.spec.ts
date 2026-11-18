import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test'

import type { components } from '../src/lib/api/schema'

const API_URL = process.env.API_URL ?? 'http://127.0.0.1:3001'

type AvailabilityDay = components['schemas']['AvailabilityDay']
type Slot = components['schemas']['Slot']

async function getAvailability(
  request: APIRequestContext,
  typeId: string,
): Promise<AvailabilityDay[]> {
  const response = await request.get(`${API_URL}/availability?type=${typeId}`)

  expect(response.ok()).toBeTruthy()

  return (await response.json()) as AvailabilityDay[]
}

async function getSlots(
  request: APIRequestContext,
  typeId: string,
  date: string,
): Promise<Slot[]> {
  const response = await request.get(
    `${API_URL}/slots?type=${typeId}&date=${date}`,
  )

  expect(response.ok()).toBeTruthy()

  return (await response.json()) as Slot[]
}

function findFreeSlot(slots: Slot[], description: string): Slot {
  const slot = slots.find((candidate) => candidate.available)

  if (!slot) {
    throw new Error(`нет свободного слота: ${description}`)
  }

  return slot
}

function findDay(
  days: AvailabilityDay[],
  predicate: (day: AvailabilityDay) => boolean,
  description: string,
): AvailabilityDay {
  const day = days.find(predicate)

  if (!day) {
    throw new Error(`нет подходящего дня: ${description}`)
  }

  return day
}

async function firstFreeSlot(
  request: APIRequestContext,
  typeId: string,
  date: string,
): Promise<Slot> {
  return findFreeSlot(await getSlots(request, typeId, date), `${typeId} ${date}`)
}

/** A call start that is free for a consultation too, so another type can take it. */
async function firstSharedFreeSlot(
  request: APIRequestContext,
  date: string,
): Promise<Slot> {
  const [callSlots, consultationSlots] = await Promise.all([
    getSlots(request, 'call', date),
    getSlots(request, 'consultation', date),
  ])
  const freeConsultationStarts = new Set(
    consultationSlots
      .filter((candidate) => candidate.available)
      .map((candidate) => candidate.start),
  )
  const slot = callSlots.find(
    (candidate) =>
      candidate.available && freeConsultationStarts.has(candidate.start),
  )

  if (!slot) {
    throw new Error(`нет общего свободного старта на ${date}`)
  }

  return slot
}

async function openBookingPage(page: Page) {
  await page.goto('/')
  await page.getByRole('main').getByRole('button', { name: 'Записаться' }).click()

  await expect(
    page.getByRole('heading', { name: 'Запись на звонок' }),
  ).toBeVisible()
}

async function pickSlot(page: Page, date: string, start: string) {
  await page.locator(`button[data-date="${date}"]`).click()

  const slotButton = page.locator(`button[data-start="${start}"]`)
  await expect(slotButton).toContainText('Свободно')
  await slotButton.click()

  await page.getByRole('button', { name: 'Продолжить' }).click()
  await expect(
    page.getByText('Подтверждение записи', { exact: true }),
  ).toBeVisible()
}

async function fillContacts(page: Page, name: string, email: string) {
  await page.getByPlaceholder('Имя').fill(name)
  await page.getByPlaceholder('Email').fill(email)
}

function dayButton(page: Page, date: string) {
  return page.locator(`button[data-date="${date}"]`)
}

test('гость меняет тип, бронирует свободный слот и видит встречу у владельца', async ({
  page,
  request,
}) => {
  const [callDays, consultationDays] = await Promise.all([
    getAvailability(request, 'call'),
    getAvailability(request, 'consultation'),
  ])
  const day = findDay(
    consultationDays,
    (candidate) => candidate.freeStarts > 0,
    'свободный день для консультации',
  )
  const callDay = findDay(
    callDays,
    (candidate) => candidate.date === day.date,
    'тот же день для звонка',
  )
  const slot = await firstFreeSlot(request, 'consultation', day.date)

  await openBookingPage(page)

  // The counters follow the selected meeting type.
  await page.getByRole('button', { name: /Звонок · 30 мин/ }).click()
  await expect(dayButton(page, day.date)).toHaveAttribute(
    'aria-label',
    new RegExp(`, свободно: ${callDay.freeStarts}$`),
  )
  await page.getByRole('button', { name: /Консультация · 60 мин/ }).click()
  await expect(dayButton(page, day.date)).toHaveAttribute(
    'aria-label',
    new RegExp(`, свободно: ${day.freeStarts}$`),
  )

  await pickSlot(page, day.date, slot.start)

  await fillContacts(page, '', 'not-an-email')
  await page.getByRole('button', { name: 'Подтвердить запись' }).click()
  await expect(page.getByText('Укажите имя')).toBeVisible()
  await expect(page.getByText('Некорректный email')).toBeVisible()

  // The public instance keeps bookings between runs, so identify this guest
  // by values unique to this test run.
  const runId = Date.now()
  const guestName = `Тест Гость ${runId}`
  const guestEmail = `guest-${runId}@example.com`

  await fillContacts(page, guestName, guestEmail)
  await page.getByRole('button', { name: 'Подтвердить запись' }).click()

  await expect(
    page.getByRole('heading', { name: 'Бронь подтверждена. До встречи!' }),
  ).toBeVisible()
  await expect(page.getByText('Консультация · 60 мин').first()).toBeVisible()

  await page.getByRole('button', { name: 'Предстоящие события' }).click()

  await expect(
    page.getByRole('heading', { name: 'Предстоящие события' }),
  ).toBeVisible()

  const bookingCard = page
    .locator('[data-slot="card"]')
    .filter({ hasText: guestEmail })

  await expect(bookingCard).toContainText(guestName)
  await expect(bookingCard).toContainText('Тип: Консультация')
})

test('занятый слот помечается, повторная запись даёт понятную ошибку', async ({
  page,
  request,
}) => {
  const days = await getAvailability(request, 'call')
  const day = findDay(
    days,
    (candidate) => candidate.freeStarts > 1,
    'день с запасом свободных слотов',
  )
  const slot = await firstSharedFreeSlot(request, day.date)

  await openBookingPage(page)
  await pickSlot(page, day.date, slot.start)
  await fillContacts(page, 'Гость Конфликт', 'conflict@example.com')

  // While the guest fills the form, another client books the same time
  // through the real API. No response mocking is involved.
  const occupied = await request.post(`${API_URL}/bookings`, {
    data: {
      typeId: 'consultation',
      start: slot.start,
      name: 'Другой гость',
      email: 'other@example.com',
    },
  })

  expect(occupied.status()).toBe(201)

  await page.getByRole('button', { name: 'Подтвердить запись' }).click()

  await expect(page.getByText('Слот уже занят')).toBeVisible()

  const busySlot = page.locator(`button[data-start="${slot.start}"]`)
  await expect(busySlot).toContainText('Занято')
  await expect(busySlot).toBeDisabled()

  // The form keeps the guest's input after the conflict.
  await page.locator('button[data-start]:not([disabled])').first().click()
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await expect(page.getByPlaceholder('Имя')).toHaveValue('Гость Конфликт')
  await expect(page.getByPlaceholder('Email')).toHaveValue('conflict@example.com')

  const repeat = await request.post(`${API_URL}/bookings`, {
    data: {
      typeId: 'call',
      start: slot.start,
      name: 'Ещё один гость',
      email: 'repeat@example.com',
    },
  })

  expect(repeat.status()).toBe(409)
  expect(await repeat.json()).toEqual({
    error: expect.objectContaining({ code: 'slot_taken' }),
  })
})

test('день без свободных стартов недоступен в календаре', async ({
  page,
  request,
}) => {
  const days = await getAvailability(request, 'call')
  const firstDay = days[0]

  if (!firstDay) {
    throw new Error('окно записи пустое')
  }

  const sameMonthDays = days.filter((candidate) =>
    candidate.date.startsWith(firstDay.date.slice(0, 7)),
  )
  const day =
    [...sameMonthDays].reverse().find((candidate) => candidate.freeStarts > 0) ??
    days[days.length - 1]

  if (!day) {
    throw new Error('в окне записи нет дней')
  }

  const freeSlots = (await getSlots(request, 'call', day.date)).filter(
    (slot) => slot.available,
  )

  for (const slot of freeSlots) {
    const response = await request.post(`${API_URL}/bookings`, {
      data: {
        typeId: 'call',
        start: slot.start,
        name: 'Занятый день',
        email: 'busy-day@example.com',
      },
    })

    expect([201, 409]).toContain(response.status())
  }

  const updated = findDay(
    await getAvailability(request, 'call'),
    (candidate) => candidate.date === day.date,
    'выбранный день',
  )

  expect(updated.freeStarts).toBe(0)

  await openBookingPage(page)

  const button = dayButton(page, day.date)
  await expect(button).toHaveAttribute('aria-label', /, свободно: 0$/)
  await expect(button).toBeDisabled()
})

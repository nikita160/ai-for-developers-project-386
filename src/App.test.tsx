/** @vitest-environment jsdom */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import App from './App'

vi.mock('@/lib/api', () => ({
  getHealth: vi.fn().mockResolvedValue({ status: 'ok' }),
  getMeetingTypes: vi
    .fn()
    .mockResolvedValue([
      { id: 'call', name: 'Звонок', durationMinutes: 30 },
    ]),
  getAvailability: vi.fn().mockResolvedValue([]),
  getSlots: vi.fn().mockResolvedValue([]),
  createBooking: vi.fn(),
  getUpcomingBookings: vi.fn().mockResolvedValue([]),
}))

describe('home page', () => {
  it('opens the landing page and leads to the booking page', async () => {
    const user = userEvent.setup()

    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Calendar' }),
    ).toBeTruthy()

    const main = screen.getByRole('main')
    await user.click(within(main).getByRole('button', { name: 'Записаться' }))

    expect(
      screen.getByRole('heading', { name: 'Запись на звонок' }),
    ).toBeTruthy()
  })
})

import { useState } from 'react'

import { BookingInfo } from '@/components/booking-info'
import { MonthCalendar } from '@/components/month-calendar'
import { SlotList } from '@/components/slot-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  getFreeSlotsCount,
  getSlotsForDate,
  startOfDay,
  startOfMonth,
  toISODate,
  type Booking,
  type Slot,
} from '@/lib/booking'

type BookingPageProps = {
  bookings: Booking[]
  onCreate: (booking: Booking) => void
  onBack: () => void
}

type Step = 'select' | 'confirm' | 'done'

const TODAY = startOfDay(new Date())

export function BookingPage({ bookings, onCreate, onBack }: BookingPageProps) {
  const [step, setStep] = useState<Step>('select')
  const [month, setMonth] = useState(() => startOfMonth(TODAY))
  const [date, setDate] = useState<Date | null>(null)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [attempted, setAttempted] = useState(false)

  const slots = date ? getSlotsForDate(date, bookings) : []
  const freeCount = date ? getFreeSlotsCount(date, bookings) : 0
  const isNameInvalid = attempted && name.trim().length === 0
  const isEmailInvalid = attempted && email.trim().length === 0

  function handleSelectDate(nextDate: Date) {
    setDate(nextDate)
    setSlot(null)
  }

  function handleReset() {
    setStep('select')
    setDate(null)
    setSlot(null)
    setName('')
    setEmail('')
    setAttempted(false)
  }

  function handleConfirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!date || !slot) {
      return
    }

    if (!name.trim() || !email.trim()) {
      setAttempted(true)
      return
    }

    onCreate({
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim(),
      date: toISODate(date),
      start: slot.start,
      end: slot.end,
      createdAt: new Date(),
    })
    setStep('done')
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Запись на звонок</h1>

      {step === 'select' ? (
        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(0,320px)]">
          <BookingInfo date={date} slot={slot} freeCount={freeCount} />

          <Card className="[--card-spacing:--spacing(5)]">
            <CardContent>
              <MonthCalendar
                month={month}
                selected={date}
                bookings={bookings}
                onMonthChange={setMonth}
                onSelect={handleSelectDate}
              />
            </CardContent>
          </Card>

          <Card className="h-fit [--card-spacing:--spacing(5)]">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Статус слотов
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {date ? (
                <SlotList slots={slots} selected={slot} onSelect={setSlot} />
              ) : (
                <div className="rounded-lg bg-secondary px-4 py-3 text-sm text-muted-foreground">
                  Выберите дату в календаре.
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 flex-1"
                  onClick={onBack}
                >
                  Назад
                </Button>
                <Button
                  type="button"
                  className="h-10 flex-1"
                  disabled={!slot}
                  onClick={() => setStep('confirm')}
                >
                  Продолжить
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {step === 'confirm' ? (
        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <BookingInfo date={date} slot={slot} freeCount={freeCount} />

          <Card className="[--card-spacing:--spacing(5)]">
            <CardHeader className="grid grid-cols-[1fr_auto] items-center">
              <CardTitle className="text-base font-semibold">
                Подтверждение записи
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={() => setStep('select')}
              >
                Изменить
              </Button>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleConfirm}
                className="flex flex-col gap-3"
              >
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Имя"
                  autoComplete="name"
                  aria-invalid={isNameInvalid}
                  className="h-10 bg-card"
                />
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  aria-invalid={isEmailInvalid}
                  className="h-10 bg-card"
                />
                <Button type="submit" className="h-10 w-full font-semibold">
                  Подтвердить запись
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {step === 'done' ? (
        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <BookingInfo date={date} slot={slot} freeCount={freeCount} />

          <Card className="[--card-spacing:--spacing(6)]">
            <CardContent className="flex flex-col gap-6">
              <h2 className="text-center text-xl font-bold">
                Бронь подтверждена. До встречи!
              </h2>
              <Button className="h-10 w-full font-semibold" onClick={handleReset}>
                Забронировать еще
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </main>
  )
}

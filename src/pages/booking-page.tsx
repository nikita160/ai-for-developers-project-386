import { useEffect, useRef, useState } from 'react'

import { BookingInfo } from '@/components/booking-info'
import { MonthCalendar } from '@/components/month-calendar'
import { SlotList } from '@/components/slot-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  createBooking,
  getAvailability,
  getMeetingTypes,
  getSlots,
  type AvailabilityDay,
  type MeetingType,
  type Slot,
} from '@/lib/api'
import { monthOfDate, MOSCOW_TIME_ZONE, type Month } from '@/lib/booking'
import { errorCode, errorField, errorMessage } from '@/lib/errors'

type BookingPageProps = {
  onBack: () => void
}

type Step = 'select' | 'confirm' | 'done'

const INITIAL_MONTH: Month = monthOfDate(
  new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: MOSCOW_TIME_ZONE,
  }).format(new Date()),
)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function BookingPage({ onBack }: BookingPageProps) {
  const [step, setStep] = useState<Step>('select')
  const [types, setTypes] = useState<MeetingType[]>([])
  const [typeId, setTypeId] = useState('')
  const [availability, setAvailability] = useState<AvailabilityDay[]>([])
  const [month, setMonth] = useState<Month>(INITIAL_MONTH)
  const [date, setDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [slot, setSlot] = useState<Slot | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    email?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSlotsLoading, setIsSlotsLoading] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)
  const hasSetInitialMonth = useRef(false)

  const selectedType = types.find((type) => type.id === typeId) ?? null
  const freeCount = date
    ? (availability.find((day) => day.date === date)?.freeStarts ?? 0)
    : null
  const availabilityByDate = Object.fromEntries(
    availability.map((day) => [day.date, day.freeStarts]),
  )

  useEffect(() => {
    const controller = new AbortController()

    getMeetingTypes(controller.signal)
      .then((list) => {
        setTypes(list)
        setTypeId((current) => current || list[0]?.id || '')
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(errorMessage(cause))
        }
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!typeId) {
      return
    }

    const controller = new AbortController()

    getAvailability(typeId, controller.signal)
      .then((days) => {
        setAvailability(days)

        if (!hasSetInitialMonth.current && days[0]) {
          setMonth(monthOfDate(days[0].date))
          hasSetInitialMonth.current = true
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(errorMessage(cause))
        }
      })

    return () => controller.abort()
  }, [typeId, refreshToken])

  useEffect(() => {
    if (!typeId || !date) {
      return
    }

    const controller = new AbortController()

    setIsSlotsLoading(true)
    getSlots(typeId, date, controller.signal)
      .then(setSlots)
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(errorMessage(cause))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsSlotsLoading(false)
        }
      })

    return () => controller.abort()
  }, [typeId, date, refreshToken])

  function handleTypeChange(nextTypeId: string) {
    if (nextTypeId === typeId) {
      return
    }

    setTypeId(nextTypeId)
    setAvailability([])
    setSlots([])
    setDate(null)
    setSlot(null)
    setError(null)
  }

  function handleDateChange(nextDate: string) {
    setDate(nextDate)
    setSlots([])
    setSlot(null)
    setError(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!typeId || !slot) {
      return
    }

    const nextFieldErrors: { name?: string; email?: string } = {}

    if (!name.trim()) {
      nextFieldErrors.name = 'Укажите имя'
    } else if (name.trim().length > 100) {
      nextFieldErrors.name = 'Не более 100 символов'
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      nextFieldErrors.email = 'Некорректный email'
    }

    setFieldErrors(nextFieldErrors)

    if (Object.keys(nextFieldErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await createBooking({
        typeId,
        start: slot.start,
        name,
        email,
      })
      setStep('done')

      if (date) {
        getAvailability(typeId).then(setAvailability).catch(() => {})
        getSlots(typeId, date).then(setSlots).catch(() => {})
      }
    } catch (cause) {
      setError(errorMessage(cause))

      const field = errorField(cause)

      if (field === 'name') {
        setFieldErrors({ name: errorMessage(cause) })
      } else if (field === 'email') {
        setFieldErrors({ email: errorMessage(cause) })
      }

      if (errorCode(cause) === 'slot_taken') {
        setSlot(null)
        setStep('select')
        setRefreshToken((value) => value + 1)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleReset() {
    setStep('select')
    setDate(null)
    setSlot(null)
    setSlots([])
    setAvailability([])
    setName('')
    setEmail('')
    setError(null)
    setFieldErrors({})
    setRefreshToken((value) => value + 1)
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Запись на звонок</h1>

      {step === 'select' ? (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Тип встречи</span>
            {types.map((type) => (
              <Button
                key={type.id}
                type="button"
                variant={type.id === typeId ? 'default' : 'outline'}
                className="h-10"
                onClick={() => handleTypeChange(type.id)}
              >
                {type.name} · {type.durationMinutes} мин
              </Button>
            ))}
          </div>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(0,320px)]">
            <BookingInfo
              type={selectedType}
              date={date}
              slot={slot}
              freeCount={freeCount}
            />

            <Card className="[--card-spacing:--spacing(5)]">
              <CardContent>
                <MonthCalendar
                  month={month}
                  selectedDate={date}
                  availability={availabilityByDate}
                  onMonthChange={setMonth}
                  onSelect={handleDateChange}
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
                  slots.length > 0 ? (
                    <SlotList
                      slots={slots}
                      selectedStart={slot?.start ?? null}
                      onSelect={setSlot}
                    />
                  ) : (
                    <div className="rounded-lg bg-secondary px-4 py-3 text-sm text-muted-foreground">
                      {isSlotsLoading
                        ? 'Загрузка слотов…'
                        : 'На этот день нет слотов'}
                    </div>
                  )
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
        </div>
      ) : null}

      {step === 'confirm' ? (
        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <BookingInfo
            type={selectedType}
            date={date}
            slot={slot}
            freeCount={freeCount}
          />

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
                onSubmit={handleSubmit}
                noValidate
                className="flex flex-col gap-3"
              >
                <div className="flex flex-col gap-1">
                  <Input
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value)
                      setFieldErrors((current) => ({
                        ...current,
                        name: undefined,
                      }))
                    }}
                    placeholder="Имя"
                    autoComplete="name"
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={
                      fieldErrors.name ? 'booking-name-error' : undefined
                    }
                    className="h-10 bg-card"
                  />
                  {fieldErrors.name ? (
                    <p
                      id="booking-name-error"
                      className="text-xs text-destructive"
                    >
                      {fieldErrors.name}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1">
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setFieldErrors((current) => ({
                        ...current,
                        email: undefined,
                      }))
                    }}
                    placeholder="Email"
                    autoComplete="email"
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={
                      fieldErrors.email ? 'booking-email-error' : undefined
                    }
                    className="h-10 bg-card"
                  />
                  {fieldErrors.email ? (
                    <p
                      id="booking-email-error"
                      className="text-xs text-destructive"
                    >
                      {fieldErrors.email}
                    </p>
                  ) : null}
                </div>
                {error ? (
                  <p className="text-sm text-destructive">{error}</p>
                ) : null}
                <Button
                  type="submit"
                  className="h-10 w-full font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Отправляем…' : 'Подтвердить запись'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {step === 'done' ? (
        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <BookingInfo
            type={selectedType}
            date={date}
            slot={slot}
            freeCount={freeCount}
          />

          <Card className="[--card-spacing:--spacing(6)]">
            <CardContent className="flex flex-col gap-6">
              <h2 className="text-center text-xl font-bold">
                Бронь подтверждена. До встречи!
              </h2>
              <Button
                className="h-10 w-full font-semibold"
                onClick={handleReset}
              >
                Забронировать еще
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </main>
  )
}


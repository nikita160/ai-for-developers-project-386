import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  createMeetingType,
  listBookings,
  listMeetingTypes,
  unwrap,
  type Booking,
  type MeetingType,
} from '@/lib/api'
import {
  formatCreatedAt,
  formatDateLabel,
  formatSlotRange,
  moscowDateOf,
} from '@/lib/booking'
import { errorMessage } from '@/lib/errors'
import { meetingTypeName } from '@/lib/meeting-types'

type FieldErrors = {
  name?: string
  description?: string
  durationMinutes?: string
}

export function EventsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [types, setTypes] = useState<MeetingType[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      unwrap(listBookings({ query: { upcoming: true }, signal: controller.signal })),
      unwrap(listMeetingTypes({ signal: controller.signal })),
    ])
      .then(([upcoming, meetingTypes]) => {
        setBookings(upcoming)
        setTypes(meetingTypes)
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(errorMessage(cause))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [])

  async function handleCreateType(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextFieldErrors: FieldErrors = {}
    const trimmedName = name.trim()
    const trimmedDescription = description.trim()
    const parsedDuration = Number(durationMinutes)

    if (!trimmedName) {
      nextFieldErrors.name = 'Укажите название'
    } else if (trimmedName.length > 100) {
      nextFieldErrors.name = 'Не более 100 символов'
    }

    if (!trimmedDescription) {
      nextFieldErrors.description = 'Укажите описание'
    } else if (trimmedDescription.length > 500) {
      nextFieldErrors.description = 'Не более 500 символов'
    }

    if (
      !Number.isInteger(parsedDuration) ||
      parsedDuration < 1 ||
      parsedDuration > 540
    ) {
      nextFieldErrors.durationMinutes =
        'Целое число от 1 до 540 минут'
    }

    setFieldErrors(nextFieldErrors)

    if (Object.keys(nextFieldErrors).length > 0) {
      return
    }

    setIsCreating(true)
    setFormError(null)

    try {
      await unwrap(
        createMeetingType({
          body: { name: trimmedName, description: trimmedDescription, durationMinutes: parsedDuration },
        }),
      )
      setName('')
      setDescription('')
      setDurationMinutes('')
      setFieldErrors({})
      setTypes(await unwrap(listMeetingTypes({})))
    } catch (cause) {
      setFormError(errorMessage(cause))
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Предстоящие события</h1>

      {error ? <p className="mt-6 text-sm text-destructive">{error}</p> : null}

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Загрузка…</p>
      ) : null}

      {!isLoading && !error && bookings.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Пока нет предстоящих событий.
        </p>
      ) : null}

      {bookings.length > 0 ? (
        <div className="mt-6 flex flex-col gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="[--card-spacing:--spacing(6)]">
              <CardContent className="flex flex-col gap-1">
                <p className="text-base font-semibold">{booking.name}</p>
                <p className="text-sm text-muted-foreground">{booking.email}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Тип: {meetingTypeName(types, booking.typeId)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Слот:{' '}
                  {formatDateLabel(moscowDateOf(booking.start))},{' '}
                  {formatSlotRange(booking.start, booking.end)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Создано: {formatCreatedAt(booking.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight">Типы встреч</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Созданный тип сразу становится доступен гостю на странице записи.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {types.map((type) => (
            <div
              key={type.id}
              className="flex flex-col gap-1 rounded-lg bg-secondary px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{type.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {type.description}
                </p>
              </div>
              <p className="text-sm whitespace-nowrap text-muted-foreground">
                {type.durationMinutes} мин
              </p>
            </div>
          ))}
        </div>

        <Card className="mt-6 [--card-spacing:--spacing(5)]">
          <CardContent>
            <form
              onSubmit={handleCreateType}
              noValidate
              className="flex flex-col gap-3"
            >
              <div>
                <h3 className="text-base font-semibold">Создать тип встречи</h3>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="meeting-type-name">Название</Label>
                <Input
                  id="meeting-type-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    setFieldErrors((current) => ({ ...current, name: undefined }))
                  }}
                  placeholder="Например, Ревью"
                  aria-invalid={Boolean(fieldErrors.name)}
                  className="h-10 bg-card"
                />
                {fieldErrors.name ? (
                  <p className="text-xs text-destructive">{fieldErrors.name}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="meeting-type-description">Описание</Label>
                <Textarea
                  id="meeting-type-description"
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value)
                    setFieldErrors((current) => ({
                      ...current,
                      description: undefined,
                    }))
                  }}
                  placeholder="Для чего нужен этот формат встречи"
                  aria-invalid={Boolean(fieldErrors.description)}
                  className="min-h-20 bg-card"
                />
                {fieldErrors.description ? (
                  <p className="text-xs text-destructive">
                    {fieldErrors.description}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="meeting-type-duration">
                  Длительность, минут
                </Label>
                <Input
                  id="meeting-type-duration"
                  type="number"
                  min={1}
                  max={540}
                  value={durationMinutes}
                  onChange={(event) => {
                    setDurationMinutes(event.target.value)
                    setFieldErrors((current) => ({
                      ...current,
                      durationMinutes: undefined,
                    }))
                  }}
                  placeholder="30"
                  aria-invalid={Boolean(fieldErrors.durationMinutes)}
                  className="h-10 bg-card"
                />
                {fieldErrors.durationMinutes ? (
                  <p className="text-xs text-destructive">
                    {fieldErrors.durationMinutes}
                  </p>
                ) : null}
              </div>

              {formError ? (
                <p className="text-sm text-destructive">{formError}</p>
              ) : null}

              <Button
                type="submit"
                className="h-10 w-full font-semibold"
                disabled={isCreating}
              >
                {isCreating ? 'Создаём…' : 'Создать тип'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
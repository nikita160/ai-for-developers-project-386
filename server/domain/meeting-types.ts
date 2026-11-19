import { randomUUID } from 'node:crypto'

import { apiError, type ApiError, type ApiErrorCode } from './errors'

/** Длина рабочего дня владельца 09:00–18:00; длительность типа должна в него умещаться. */
export const MAX_MEETING_DURATION_MINUTES = 9 * 60

export type MeetingType = {
  id: string
  name: string
  description: string
  durationMinutes: number
}

/** Изменяемое хранилище типов встреч; новые типы сразу видны гостю. */
export type MeetingTypeStore = {
  list(): MeetingType[]
  add(type: MeetingType): void
}

/** Типы по умолчанию при старте сервиса. */
export const SEED_MEETING_TYPES: MeetingType[] = [
  {
    id: 'call',
    name: 'Звонок',
    description: 'Короткий звонок, чтобы быстро разобрать один вопрос.',
    durationMinutes: 30,
  },
  {
    id: 'consultation',
    name: 'Консультация',
    description: 'Развёрнутая консультация с погружением в задачу.',
    durationMinutes: 60,
  },
]

export function findMeetingType(
  types: MeetingType[],
  id: string,
): MeetingType | undefined {
  return types.find((type) => type.id === id)
}

export type CreateMeetingTypeInput = {
  name: string
  description: string
  durationMinutes: number
}

export type CreateMeetingTypeResult =
  | { ok: true; type: MeetingType }
  | { ok: false; error: ApiError }

/** Создаёт тип встречи с серверным id; владелец задаёт название, описание и длительность. */
export function createMeetingType(
  store: MeetingTypeStore,
  input: CreateMeetingTypeInput,
): CreateMeetingTypeResult {
  const name = input.name.trim()

  if (name.length === 0 || name.length > 100) {
    return fail('validation_error', 'Название должно быть от 1 до 100 символов', {
      field: 'name',
    })
  }

  const description = input.description.trim()

  if (description.length === 0 || description.length > 500) {
    return fail(
      'validation_error',
      'Описание должно быть от 1 до 500 символов',
      { field: 'description' },
    )
  }

  if (
    !Number.isInteger(input.durationMinutes) ||
    input.durationMinutes < 1 ||
    input.durationMinutes > MAX_MEETING_DURATION_MINUTES
  ) {
    return fail(
      'validation_error',
      `Длительность должна быть целым числом от 1 до ${MAX_MEETING_DURATION_MINUTES} минут`,
      { field: 'durationMinutes' },
    )
  }

  const type: MeetingType = {
    id: randomUUID(),
    name,
    description,
    durationMinutes: input.durationMinutes,
  }

  store.add(type)

  return { ok: true, type }
}

function fail(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, string>,
): CreateMeetingTypeResult {
  return { ok: false, error: apiError(code, message, details) }
}

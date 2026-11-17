export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: Record<string, string>

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: Record<string, string>,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Не удалось выполнить запрос'
}

export function errorCode(error: unknown): string | undefined {
  return error instanceof ApiError ? error.code : undefined
}

export function errorField(error: unknown): string | undefined {
  return error instanceof ApiError ? error.details?.field : undefined
}

/** Код ошибки API. */
export type ApiErrorCode = 'validation_error' | 'slot_taken' | 'date_out_of_window'

/** Тело ошибки `{ error: { code, message, details? } }`. */
export type ApiError = {
  code: ApiErrorCode
  message: string
  details?: Record<string, string>
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, string>,
): ApiError {
  return details ? { code, message, details } : { code, message }
}

import "@typespec/http";
import "@typespec/openapi3";

using Http;
using OpenAPI;

/** API сервиса записи на звонок. */
@service(#{ title: "Calendar API" })
@server("http://localhost:3001", "Local development server")
namespace CalendarApi;

/** Момент времени в Europe/Moscow с фиксированным офсетом. */
@pattern("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\+03:00$")
scalar MoscowDateTime extends string;

/** Состояние сервиса. */
model HealthStatus {
  status: "ok";
}

/** Тип встречи с фиксированной длительностью. */
model MeetingType {
  id: string;
  name: string;
  /** Длительность встречи в минутах; задаёт длину слота и шаг доступных стартов. */
  durationMinutes: int32;
}

/** День окна записи и число свободных стартов. */
model AvailabilityDay {
  date: plainDate;
  freeStarts: int32;
}

/** Старт встречи выбранного типа; длительность равна длительности типа. */
model Slot {
  start: MoscowDateTime;
  end: MoscowDateTime;
  available: boolean;
}

/** Бронь слота гостем: имя, email и интервал в Europe/Moscow. */
model Booking {
  id: string;
  typeId: string;
  start: MoscowDateTime;
  end: MoscowDateTime;
  name: string;
  email: string;
  createdAt: utcDateTime;
}

/** Запрос на создание брони. */
model BookingRequest {
  typeId: string;
  start: MoscowDateTime;
  name: string;
  email: string;
}

/** Тело ошибки. */
model ErrorBody {
  code: string;
  message: string;
  details?: Record<string>;
}

/** Ответ с ошибкой. */
model ErrorResponse {
  error: ErrorBody;
}

model CreatedBooking {
  @statusCode statusCode: 201;
  @body booking: Booking;
}

model BadRequestResponse {
  @statusCode statusCode: 400;
  @body body: ErrorResponse;
}

model ConflictResponse {
  @statusCode statusCode: 409;
  @body body: ErrorResponse;
}

/** Проверка доступности API. */
@route("/health")
@get
op health(): HealthStatus;

/** Список типов встреч. */
@route("/meeting-types")
@get
op listMeetingTypes(): MeetingType[];

/**
 * Доступность на 14 календарных дней окна записи, начиная с завтрашнего дня
 * по Europe/Moscow (UTC+3); окно сдвигается ежедневно. `freeStarts` — число
 * стартов дня, свободных для выбранного типа встречи.
 */
@route("/availability")
@get
op getAvailability(@query type: string): AvailabilityDay[] | BadRequestResponse;

/**
 * Старты выбранного дня для типа встречи: сетка 30 минут в рабочих часах
 * 09:00–18:00 Europe/Moscow (UTC+3). Последний старт — 18:00 минус длительность
 * типа; слот целиком помещается в рабочие часы и длится столько, сколько тип.
 */
@route("/slots")
@get
op listSlots(
  @query type: string,
  @query date: plainDate,
): Slot[] | BadRequestResponse;

/**
 * Создание брони. Бронь занимает полуинтервал [start, end); наложение
 * положительной длины с любой другой бронью, включая другой тип встречи,
 * отклоняется с 409 `slot_taken`.
 */
@route("/bookings")
@post
op createBooking(
  @body request: BookingRequest,
): CreatedBooking | BadRequestResponse | ConflictResponse;

/** Предстоящие брони по возрастанию старта. `upcoming=false` возвращает и прошедшие. */
@route("/bookings")
@get
op listBookings(@query upcoming?: boolean): Booking[];

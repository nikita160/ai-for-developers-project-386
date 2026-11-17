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
  durationMinutes: int32;
}

/** День окна записи и число свободных стартов. */
model AvailabilityDay {
  date: plainDate;
  freeStarts: int32;
}

/** Старт встречи выбранного типа. */
model Slot {
  start: MoscowDateTime;
  end: MoscowDateTime;
  available: boolean;
}

/** Бронь слота гостем. */
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

/** Доступность на 14 дней окна записи для выбранного типа. */
@route("/availability")
@get
op getAvailability(@query type: string): AvailabilityDay[] | BadRequestResponse;

/** Старты выбранного дня для типа встречи. */
@route("/slots")
@get
op listSlots(
  @query type: string,
  @query date: plainDate,
): Slot[] | BadRequestResponse;

/** Создание брони. */
@route("/bookings")
@post
op createBooking(
  @body request: BookingRequest,
): CreatedBooking | BadRequestResponse | ConflictResponse;

/** Предстоящие брони по возрастанию старта. `upcoming=false` возвращает и прошедшие. */
@route("/bookings")
@get
op listBookings(@query upcoming?: boolean): Booking[];

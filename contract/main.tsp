import "@typespec/http";
import "@typespec/openapi3";

using Http;
using OpenAPI;

/** API сервиса записи на звонок. */
@service(#{ title: "Calendar API" })
@server("http://localhost:3001", "Local development server")
namespace CalendarApi;

/** Состояние сервиса. */
model HealthStatus {
  status: "ok";
}

/** Проверка доступности API. */
@route("/health")
@get
op health(): HealthStatus;

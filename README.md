# Календарь звонков

[![hexlet-check](https://github.com/nikita160/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/nikita160/ai-for-developers-project-386/actions)
[![CI](https://github.com/nikita160/ai-for-developers-project-386/actions/workflows/ci.yml/badge.svg)](https://github.com/nikita160/ai-for-developers-project-386/actions/workflows/ci.yml)

Сервис для бронирования календаря: выбор даты и времени звонка, подтверждение записи и список предстоящих событий.

**Демо:** https://calendar-booking-9ie4.onrender.com

Учебный проект Хекслета: https://ru.hexlet.io/programs/ai-for-developers
Как это должно работать: https://files.hexlet.app/a/2ipc5m

## Стек

- TypeScript, React 19, Vite 8
- shadcn/ui, Tailwind CSS 4
- Hono + `@hono/node-server` (API)
- TypeSpec → OpenAPI → типизированный клиент (`openapi-fetch`)
- Vitest, oxlint
- mise (версии, задачи, daemons), hk (git-хуки), GitHub Actions

## Установка

Нужен [mise](https://mise.jdx.dev) — он ставит Node и остальные инструменты из `mise.toml`.

```bash
git clone https://github.com/nikita160/ai-for-developers-project-386.git
cd ai-for-developers-project-386
mise install        # Node 22.23.5, hk, pitchfork
mise run install    # npm-зависимости
```

## Использование

```bash
mise run dev      # API на :3001 и фронтенд на :5173 (daemons)
mise run check    # линтер, проверка типов, API-тесты, браузерный тест и дрейф контракта
mise run build    # production-сборка

mise run test:e2e                # браузерный сценарий против настоящего API
# локально нужен Google Chrome; в CI ставится Playwright Chromium:
# npx playwright install chromium
```

- Фронтенд: http://localhost:5173
- API: http://localhost:3001/health
- Остановить серверы: `mise daemons stop`

Данные хранятся в памяти процесса API — см. раздел [«Хранение данных»](#хранение-данных).

Контракт API и клиентский SDK генерируются из TypeSpec:

```bash
mise run contract        # contract/openapi.yaml + src/lib/api/schema.d.ts
mise run contract:check  # проверить, что генерация не даёт диффа
```

### Структура

- `contract/` — TypeSpec-контракт (`main.tsp`) и сгенерированный `openapi.yaml`
- `server/` — API на Hono (`app.ts` — маршруты, `index.ts` — запуск)
- `src/` — React-приложение, клиент API в `src/lib/api`
- `AGENTS.md` — команды, устройство проекта и правила для агентов
- `release-please-config.json`, `.release-please-manifest.json` — автоматические релизы по Conventional Commits

### Релизы

Release-please открывает release PR с версией и CHANGELOG, а после merge создаёт тег и GitHub Release. Чтобы release PR запускал CI, добавьте fine-grained PAT с правами Contents и Pull requests в секрет `RELEASE_PLEASE_TOKEN`: PR, созданный `GITHUB_TOKEN`, не запускает workflow. Запасной вариант — запустить CI вручную (`workflow_dispatch`) на ветке release PR.

## Деплой

Приложение опубликовано: **https://calendar-booking-9ie4.onrender.com**

В production один процесс Hono (`npm start`) отдаёт собранный SPA из `dist` и API на том же origin. Порт берётся из `PORT` (локально — `API_PORT`, затем `3001`), сервер слушает `0.0.0.0`.

```bash
docker build -t calendar-booking .
docker run --rm -p 8080:8080 -e PORT=8080 calendar-booking
# http://localhost:8080
```

`Dockerfile` собирает SPA в отдельной стадии и ставит в runtime только production-зависимости. `tsx` лежит в `dependencies`, потому что `npm start` запускает TypeScript-сервер.

Хостинг — Render: `render.yaml` описывает web-сервис из `Dockerfile` с healthcheck `/health`, а Render сам передаёт `PORT` в контейнер. `railway.json` содержит те же настройки для Railway на случай, если Render недоступен.

Публичную ссылку проверяет workflow `Verify deployment` (`.github/workflows/verify-deploy.yml`, ручной запуск с параметром `base_url`): он создаёт бронь через публичный адрес, находит её в списке предстоящих и убеждается, что пересекающаяся запись отклоняется с `409 slot_taken`.

### MCP хостинга

MCP-серверы описаны в `opencode.jsonc`; секретов в файле нет:

- `railway` (`https://mcp.railway.com`) — активный, вход по OAuth;
- `render` (`https://mcp.render.com/mcp`) — добавлен, но `disabled: true`: `mcp.render.com` не открывается из сети, где шёл деплой.

Порядок подключения:

1. Установите OpenCode и откройте корень проекта — `opencode.jsonc` подхватится автоматически.
2. Выполните `/mcps`, выберите `railway` и войдите через браузер. OAuth-токен OpenCode хранит вне проекта.
3. Дождитесь статуса `connected`: агенту станут доступны инструменты проектов, сервисов, деплоя и доменов Railway.
4. Для Render MCP получите API key в Render (Account Settings → API Keys), задайте `RENDER_API_KEY` в окружении и уберите `"disabled": true` у `render`. Ключ подставляется через `{env:RENDER_API_KEY}` и в репозиторий не попадает.
5. Токены и `.env` держите вне git: `.gitignore` и `.dockerignore` их исключают.

### Хранение данных

Брони живут в памяти процесса API (`server/store.ts`): базы, файла или внешнего хранилища нет. Поэтому:

- рестарт, redeploy и засыпание бесплатного инстанса Render стирают все брони;
- несколько реплик получат каждая свой список, и проверка пересечений перестанет быть надёжной — инстанс должен быть один;
- файловая система контейнера эфемерна, писать данные в неё бессмысленно.

Ограничение зафиксировано в ADR [`docs/adr/0001-in-memory-storage.md`](docs/adr/0001-in-memory-storage.md). Для продакшена нужна БД с транзакционной проверкой пересечений.

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.

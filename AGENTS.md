# AGENTS.md

## Команды

- `mise install` — поставить версии инструментов из `mise.toml`
- `mise run install` — установить npm-зависимости
- `mise run dev` — поднять API (`:3001`) и фронтенд (`:5173`) как daemons; `mise daemons stop` — остановить
- `mise run check` — линтер + проверка типов + API-тесты + браузерный тест + дрейф контракта; CI запускает её и production-сборку
- `mise run test`, `mise run lint`, `mise run typecheck` — отдельные проверки
- `mise run test:e2e` — браузерный сценарий Playwright против настоящего API; локально используется установленный Google Chrome, в CI — Playwright Chromium (`npx playwright install chromium`)
- `mise run contract` — перегенерировать `contract/openapi.yaml` и типизированный SDK
- `mise run contract:check` — проверить, что сгенерированные файлы совпадают с TypeSpec (падает на диффе)
- `gh workflow run verify-deploy.yml -f base_url=<url>` — проверить опубликованное приложение по публичной ссылке

## Устройство

- `contract/` — TypeSpec-контракт (`main.tsp`); `openapi.yaml` генерируется
- `server/` — API на Hono: `app.ts` (маршруты), `index.ts` (запуск)
- `src/` — React-приложение; клиент API в `src/lib/api` (`schema.d.ts` генерируется)
- `e2e/` — браузерные тесты Playwright: основной сценарий бронирования и конфликт слота против настоящего сервера, без подмены ответов API; `verify-deployment.mjs` проверяет опубликованный адрес
- `mise.toml` — версии инструментов, задачи, daemons; `hk.pkl` — git-хуки (pre-commit гоняет `mise run check` вместе с браузерным тестом)
- `Dockerfile`, `render.yaml`, `railway.json` — production-образ и настройки хостингов; приложение слушает `PORT` и раздаёт `dist`
- `opencode.jsonc` — MCP-серверы хостинга: Render по ключу из `RENDER_API_KEY`, Railway по OAuth
- `.github/workflows/release-please.yml`, `release-please-config.json`, `.release-please-manifest.json` — автоматические релизы по Conventional Commits

## Правила

- Сообщения коммитов — Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`, `refactor:`; формат проверяет `commit-msg` хук.
- Коммит реализации ссылается на тикет, который он закрывает, например `feat: запись на свободный слот (#12)`. GitHub превращает номер в ссылку, и по истории видно, какой коммит какую задачу делал.
- Изменения API начинаются в `contract/main.tsp`: правка → `mise run contract` → обновление `server/`.
- Генерируемые пути — `contract/openapi.yaml` и `src/lib/api/schema.d.ts`; руками они не редактируются. Для Hono подходящего серверного генератора нет, поэтому сервер реализован по контракту вручную.
- Перед push запускайте `mise run check`: она перегенерирует контракт и падает, если `contract/openapi.yaml` или `src/lib/api/schema.d.ts` отличаются от TypeSpec (в том числе когда файл появился или исчез). CI запускает ту же команду и дополнительно собирает production-сборку.

## Agent skills

Инженерные скиллы Мэтта Покока лежат в `.agents/skills/` (версии — в `skills-lock.json`). В OpenCode слэш-команд нет: вызывайте скилл просьбой («Запусти скилл wayfinder») или ссылкой `@.agents/skills/wayfinder/SKILL.md`.

Скиллы с `disable-model-invocation` дополнительно помечены `metadata.opencode/autoinvoke: true`, чтобы OpenCode показывал их в списке доступных. После `npx skills update` проверьте, что эта метка на месте.

Цикл работы: `grill-with-docs` → `to-spec` → `to-tickets` → `implement-spec`; настройка репозитория — `setup-matt-pocock-skills`.

### Issue tracker

GitHub Issues этого репозитория через `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Метки: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` в корне и `docs/adr/`. See `docs/agents/domain.md`.

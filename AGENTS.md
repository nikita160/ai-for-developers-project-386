# AGENTS.md

## Команды

- `mise install` — поставить версии инструментов из `mise.toml`
- `mise run install` — установить npm-зависимости
- `mise run dev` — поднять API (`:3001`) и фронтенд (`:5173`) как daemons; `mise daemons stop` — остановить
- `mise run check` — линтер + проверка типов + тесты; эту же команду запускает CI
- `mise run test`, `mise run lint`, `mise run typecheck` — отдельные проверки
- `mise run contract` — перегенерировать `contract/openapi.yaml` и типизированный SDK

## Устройство

- `contract/` — TypeSpec-контракт (`main.tsp`); `openapi.yaml` генерируется
- `server/` — API на Hono: `app.ts` (маршруты), `index.ts` (запуск)
- `src/` — React-приложение; клиент API в `src/lib/api` (`schema.d.ts` генерируется)
- `mise.toml` — версии инструментов, задачи, daemons; `hk.pkl` — git-хуки

## Правила

- Сообщения коммитов — Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`, `refactor:`; формат проверяет `commit-msg` хук.
- Изменения API начинаются в `contract/main.tsp`: правка → `mise run contract` → обновление `server/`.
- Сгенерированные файлы `contract/openapi.yaml` и `src/lib/api/schema.d.ts` руками не редактируются.
- Перед push запускайте `mise run check` — CI выполняет ту же команду.

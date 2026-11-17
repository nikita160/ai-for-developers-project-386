# AGENTS.md

## Команды

- `mise install` — поставить версии инструментов из `mise.toml`
- `mise run install` — установить npm-зависимости
- `mise run dev` — поднять API (`:3001`) и фронтенд (`:5173`) как daemons; `mise daemons stop` — остановить
- `mise run check` — линтер + проверка типов + тесты; эту же команду запускает CI
- `mise run test`, `mise run lint`, `mise run typecheck` — отдельные проверки
- `mise run contract` — перегенерировать `contract/openapi.yaml` и типизированный SDK
- `mise run contract:check` — проверить, что сгенерированные файлы совпадают с TypeSpec (падает на диффе)

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

# Календарь звонков

[![hexlet-check](https://github.com/nikita160/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/nikita160/ai-for-developers-project-386/actions)
[![CI](https://github.com/nikita160/ai-for-developers-project-386/actions/workflows/ci.yml/badge.svg)](https://github.com/nikita160/ai-for-developers-project-386/actions/workflows/ci.yml)

Сервис для бронирования календаря: выбор даты и времени звонка, подтверждение записи и список предстоящих событий.

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
mise run check    # линтер, проверка типов и тесты
mise run build    # production-сборка
```

- Фронтенд: http://localhost:5173
- API: http://localhost:3001/health
- Остановить серверы: `mise daemons stop`

Данные хранятся в памяти процесса API: после перезапуска сервера созданные брони пропадают.

Контракт API и клиентский SDK генерируются из TypeSpec:

```bash
mise run contract   # contract/openapi.yaml + src/lib/api/schema.d.ts
```

### Структура

- `contract/` — TypeSpec-контракт (`main.tsp`) и сгенерированный `openapi.yaml`
- `server/` — API на Hono (`app.ts` — маршруты, `index.ts` — запуск)
- `src/` — React-приложение, клиент API в `src/lib/api`
- `AGENTS.md` — команды, устройство проекта и правила для агентов

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.

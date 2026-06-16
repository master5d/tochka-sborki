# Auto-install скрипты agentic stack (MVP: дефолтный Claude-путь ×3 ОС)

**Тикет:** `fb_1b4b72623936` (severity: medium, impact 8 × urgency 6, area: course, cat: feature)
**Дата:** 2026-06-15
**Связан:** fb_7c1b0cfd1bf9

## Проблема

Технически неподготовленные студенты спотыкаются на установке инструментов (`02-setup-guide` Meeting 2 — «Боль установки»). Нужен установщик, ставящий весь базовый agentic stack «из коробки» одной командой, под Mac/Windows/Linux. (GFW/restricted-geo вариант и прочие стеки — отдельными циклами, см. «Вне scope».)

## Решение

Два самодостаточных shell-скрипта, захостенных на `ai.mamaev.coach`, ставящих базовый стек курса — **Node.js LTS + Git + Claude Code** — одной строкой. Нетехнический студент копирует команду и получает рабочую лабораторию, как учит `02-setup-guide`.

**Почему скрипты, а не Node-утилита:** bootstrap-парадокс — кросс-платформенный установщик на Node нельзя запустить до установки Node. Поэтому нативные bash + PowerShell, которые сами ставят Node.

## Доставка

Файлы лежат в `LMS/tochka-sborki/web/public/` → CF Pages (статик-экспорт Next) раздаёт их по корню домена:
- **Mac/Linux:** `curl -fsSL https://ai.mamaev.coach/install.sh | bash`
- **Windows:** `irm https://ai.mamaev.coach/install.ps1 | iex`

Деплой — существующий job `web` по path-фильтру (правки в `LMS/tochka-sborki/web/**`).

## Единицы

### 1. `web/public/install.sh` (Mac + Linux, bash)

- Заголовок: `#!/usr/bin/env bash` + `set -euo pipefail`.
- **Детект ОС/арки:** `uname -s` → `Darwin` | `Linux`; `uname -m`.
- **Пакетный менеджер:**
  - **Mac:** Homebrew. Если `brew` отсутствует — ставит официальным one-liner'ом (`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`), затем добавляет brew в PATH для текущей сессии. Далее `brew install node git` (только отсутствующее).
  - **Linux:** детект в порядке `apt` → `dnf` → `pacman`.
    - `apt` (приоритет, Debian/Ubuntu): `sudo apt-get update && sudo apt-get install -y nodejs npm git` (с предупреждением, что нужен sudo).
    - `dnf`/`pacman`: best-effort установка node/git; при незнакомом менеджере — дружелюбный fallback-месседж со ссылкой на ручной гайд (`https://ai.mamaev.coach/lessons/02-setup-guide`) и `exit 1`.
- **Node LTS:** функция `ensure_node` — если `node` есть и major ≥ 18, пропустить; иначе поставить через активный менеджер.
- **Git:** функция `ensure_git` — проверка `command -v git`, иначе поставить.
- **Claude Code:** настроить user-level npm prefix, чтобы НЕ требовать sudo для глобального npm:
  ```sh
  npm config set prefix "$HOME/.npm-global"
  export PATH="$HOME/.npm-global/bin:$PATH"   # + дописать в ~/.profile и ~/.zshrc если строки нет
  npm install -g @anthropic-ai/claude-code
  ```
- **Doctor-блок (всегда в конце):** печатает `node --version`, `git --version`, `claude --version` (или предупреждение, если не на PATH), затем «Следующие шаги»: открыть новый терминал, выполнить `claude`, залогиниться.
- **UX:** хелперы `info`/`ok`/`warn`/`err` с ANSI-цветом; каждый шаг — одна понятная строка; ошибки на человеческом языке. Идемпотентно (повторный запуск пропускает установленное).

### 2. `web/public/install.ps1` (Windows 11, PowerShell)

- Заголовок-комментарий + `$ErrorActionPreference = 'Stop'`.
- **winget-гейт:** если `Get-Command winget` отсутствует — месседж (обнови App Installer из Microsoft Store) + `exit 1`.
- **Node LTS:** если `node` нет/стар — `winget install --silent --accept-package-agreements --accept-source-agreements OpenJS.NodeJS.LTS`.
- **Git:** если нет — `winget install --silent ... Git.Git`.
- **Refresh PATH** в текущей сессии (перечитать `Machine` + `User` env `Path`), чтобы `npm` стал виден без перезапуска.
- **Claude Code:** `npm install -g @anthropic-ai/claude-code`.
- **Doctor-блок + следующие шаги** (как в .sh). Идемпотентно.

### 3. Точка входа в `02-setup-guide`

Короткая секция «⚡ Быстрая установка (одной строкой)» ПЕРЕД ручной пошаговой установкой:
- `02-setup-guide.md` (RU, основной).
- Зеркала: `web/content/ru/02-setup-guide/*.mdx` и `web/content/en/02-setup-guide/*.mdx` (найти юнит установки, добавить блок; OS-команды через `<OsBlock os="mac|windows">` — паттерн проекта).
- Текст: одна команда на ОС + «если что-то пошло не так — пошаговый путь ниже».

## Данные / стейт

Нет. Скрипты stateless и идемпотентны.

## Тестирование

Vitest в репо — env `node`, реальный install не запускаем (нельзя в CI). Подход:

- **Content-guard тест** `web/public/install.test.ts` (паттерн `lib/content/reflection-prompts.test.ts`): читает оба файла из `public/` и проверяет инварианты:
  - `install.sh`: начинается с `#!/usr/bin/env bash`; содержит `set -euo pipefail`; содержит `@anthropic-ai/claude-code`; упоминает `brew`, `apt`, и `git`; есть маркер doctor-блока; нет `TODO`/`FIXME`/`PLACEHOLDER`.
  - `install.ps1`: содержит `winget`, `OpenJS.NodeJS.LTS`, `Git.Git`, `@anthropic-ai/claude-code`, `$ErrorActionPreference`; нет `TODO`/`FIXME`.
- **Lint/синтаксис (Task verify, локально, не блокирует если тулы недоступны):** `bash -n install.sh`; `shellcheck install.sh` если установлен; `Invoke-ScriptAnalyzer install.ps1` если доступен PSScriptAnalyzer.
- **Ручной чеклист (в плане, не автоматизируется):** реальный прогон на чистых Mac (brew), Ubuntu (apt), Windows 11 (winget) — каждый доводит до рабочего `claude --version`.

## Безопасность / доверие

`curl | bash` — индустриальный стандарт (rustup/homebrew), домен под контролем автора. Скрипты публичны и читаемы по тому же URL (можно открыть в браузере перед запуском). Никаких секретов в скриптах. Глобальный npm — в user-prefix (без sudo, не трогаем системные каталоги на Mac/brew-Linux).

## Вне scope (следующими спеками)

- GFW/restricted-geo установщик (LiteLLM proxy + local floor `llama-server` + OSS-агент Aider/Cline) — отдельный цикл (часть исходного тикета).
- Sovereign / Cloud-OSS установщики.
- Подписанные бинарники с GUI (нужен code-signing/notarization).
- Экзотические Linux-дистрибутивы за пределами apt/dnf/pacman.

## Критерий готовности

На чистой машине каждой ОС одна команда из `02-setup-guide` доводит студента до рабочего `claude` (node+git+Claude Code установлены, doctor-блок зелёный). Content-guard тесты зелёные, `bash -n` чист, RU+EN секция «быстрая установка» на месте.

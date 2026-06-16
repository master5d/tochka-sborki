# GFW/restricted-geo установщик (MVP: cloud-relay)

**Тикет:** хвост `fb_1b4b72623936` (вынесен в «Вне scope» MVP дефолтного установщика)
**Дата:** 2026-06-15
**Связан:** `2026-06-15-agentic-stack-installer-design.md` (дефолтный Claude-путь), урок `03-stack-selection/u3-behind-gfw`

## Проблема

Студенты в заблокированных регионах (GFW / корп-файрвол) не могут поставить дефолтный Claude-стек. Урок `u3-behind-gfw` учит независимому стеку: LiteLLM proxy + free-tier клауды (Cerebras, Gemini Flash) + OSS-агент Aider. Нужен установщик «одной строкой», как у дефолтного пути.

## Решение

Два захостенных скрипта (`install-gfw.sh` / `install-gfw.ps1`), ставящих cloud-relay стек: **Python + LiteLLM proxy (:4000) + Aider**, с готовым конфигом под Cerebras + Gemini Flash. Local llama-server floor — вне scope (отдельный гайд).

## Доставка

`web/public/` → CF Pages по корню:
- Mac/Linux: `curl -fsSL https://ai.mamaev.coach/install-gfw.sh | bash`
- Windows: `irm https://ai.mamaev.coach/install-gfw.ps1 | iex`

## Единицы

### 1. `web/public/install-gfw.sh` (Mac + Linux, bash, `set -euo pipefail`)

- Хелперы `info/ok/warn/err`, `have`, детект ОС/PM (как `install.sh`).
- **`ensure_python`:** Mac — `brew install python pipx`; Linux — apt(`python3 python3-pip pipx`)/dnf/pacman; незнакомый PM → fallback-месседж + `exit 1`.
- **Инструменты через pipx** (изоляция окружений): `pipx install 'litellm[proxy]'`, `pipx install aider-chat`. `pipx ensurepath` для PATH.
- **`~/.config/litellm/config.yaml`** — пишет cloud-relay конфиг (см. ниже). Идемпотентно: если файл есть — бэкап в `config.yaml.bak`, не затирать молча (warn).
- **`~/.config/litellm/.env.example`** — плейсхолдеры `CEREBRAS_API_KEY=` и `GOOGLE_API_KEY=` (ключи нельзя зашить — `curl|bash` неинтерактивен).
- **`~/.config/litellm/start.sh`** — launcher: грузит `.env` (`set -a; . .env; set +a`) и `litellm --config ~/.config/litellm/config.yaml --port 4000`. `chmod +x`.
- **Doctor-блок:** версии python/pipx/litellm/aider + следующие шаги:
  1. `cp ~/.config/litellm/.env.example ~/.config/litellm/.env` и вписать ключи Cerebras + Gemini.
  2. Запустить `~/.config/litellm/start.sh`.
  3. Навести Aider: `aider --model openai/fast-pool --openai-api-base http://localhost:4000` (нужен любой dummy `OPENAI_API_KEY`).
  - Однострочное упоминание: есть и GUI-вариант (Cline в VS Code) — указывает на тот же `:4000`.

**config.yaml (cloud-relay, точно по уроку, без обязательного local-floor):**
```yaml
model_list:
  - model_name: fast-pool
    litellm_params:
      model: cerebras/qwen-3-235b-a22b
      api_key: os.environ/CEREBRAS_API_KEY
  - model_name: balanced
    litellm_params:
      model: gemini/gemini-2.5-flash
      api_key: os.environ/GOOGLE_API_KEY
  # local-floor (llama-server :8080) — опционально, см. отдельный гайд u3 «Шаг 4»
router_settings:
  routing_strategy: simple-shuffle
  fallbacks:
    - fast-pool: ["balanced"]
```

### 2. `web/public/install-gfw.ps1` (Windows 11, PowerShell, `$ErrorActionPreference='Stop'`)

- winget-гейт; `winget install Python.Python.3.12` (если нет python); `python -m pip install --user pipx; python -m pipx ensurepath`; `pipx install 'litellm[proxy]'`, `pipx install aider-chat`.
- Конфиг/`.env.example`/`start.ps1` в `$HOME\.config\litellm` (тот же config.yaml; launcher грузит `.env` и запускает litellm на :4000).
- Doctor-блок + следующие шаги (как в .sh). Идемпотентно (бэкап существующего config.yaml).

### 3. Точка входа — `u3-behind-gfw.mdx`

Секция «⚡ Быстрая установка GFW-стека (одной строкой)» в начале concept-фазы (после `<Phase type="concept">`, перед `## Архитектура «Behind-GFW»`), RU + EN, через `<OsToggle />` + `<OsBlock os="mac|windows">`. Linux = команда Mac (`curl … | bash`). Текст: «одна команда ставит LiteLLM+Aider и пишет конфиг; дальше впиши 2 ключа — ниже разбор по шагам».

## Тестирование

- **Content-guard** `web/lib/installer-gfw.test.ts` (паттерн `installer-scripts.test.ts`, читает из `../public/`): оба скрипта содержат `litellm`, `aider`, `config.yaml`, `4000`, `cerebras`, `gemini`, doctor-маркер; `install-gfw.sh` — `#!/usr/bin/env bash` + `set -euo pipefail`; `install-gfw.ps1` — `$ErrorActionPreference = 'Stop'` + `winget`; нет `TODO/FIXME/PLACEHOLDER`.
- `bash -n public/install-gfw.sh`; pwsh parse если доступен.
- Ручной чеклист: чистый Mac/Ubuntu/Win 11 → одна команда → вписать ключи → `start` → Aider отвечает через :4000.

## Безопасность

`curl|bash` — как у дефолтного установщика (домен автора, скрипты читаемы по URL). Никаких ключей в скриптах; `.env.example` → `.env` заполняет юзер. pipx изолирует Python-окружения (не трогает системный Python).

## Вне scope

- Local llama-server floor (llama.cpp + 18GB GGUF) — отдельный гайд/цикл.
- Cline/Continue.dev установка (Aider — единственный фронт MVP; Cline лишь упомянут).
- Подписанные бинарники.

## Критерий готовности

Одна команда из `u3` ставит Python+LiteLLM+Aider и пишет `config.yaml`+`.env.example`+launcher; студент вписывает Cerebras+Gemini ключи, запускает launcher, Aider ходит через `localhost:4000`. Content-guard зелёный, `bash -n` чист, RU+EN секция на месте.

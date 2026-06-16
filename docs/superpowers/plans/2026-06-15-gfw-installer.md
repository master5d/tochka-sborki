# GFW/restricted-geo установщик — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Захостить `install-gfw.sh`/`install-gfw.ps1` — ставят Python+LiteLLM proxy+Aider и пишут cloud-relay конфиг (Cerebras+Gemini) одной строкой (хвост `fb_1b4b72623936`).

**Architecture:** Статик-файлы в `web/public/` → CF Pages по корню `ai.mamaev.coach`. Нативные shell-скрипты. Проверка — content-guard vitest + `bash -n`.

**Tech Stack:** bash, PowerShell, Python/pipx, LiteLLM, Aider, Vitest, CF Pages.

**Spec:** `docs/superpowers/specs/2026-06-15-gfw-installer-design.md`

**Пути:** от `LMS/tochka-sborki/web/`. **Тесты:** из `web/` → `npx vitest run <path>`.

## Файловые треки (непересекающиеся)
- **A:** `web/public/install-gfw.sh`
- **B:** `web/public/install-gfw.ps1`
- **C:** `web/lib/installer-gfw.test.ts` (content-guard)
- **D:** `web/content/{ru,en}/03-stack-selection/u3-behind-gfw.mdx` (точка входа)

---

## Track A — Task 1: install-gfw.sh

**Files:** Create `web/public/install-gfw.sh`

- [ ] **Step 1: Создать файл (финальное содержимое):**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Точка Сборки — установщик GFW/restricted-geo стека (Mac/Linux)
# Ставит: Python + LiteLLM proxy + Aider; пишет cloud-relay конфиг (Cerebras + Gemini Flash).
# Использование: curl -fsSL https://ai.mamaev.coach/install-gfw.sh | bash

GUIDE_URL="https://ai.mamaev.coach/lessons/03-stack-selection"
CFG_DIR="$HOME/.config/litellm"

if [ -t 1 ]; then
  C_RESET='\033[0m'; C_BLUE='\033[1;34m'; C_GREEN='\033[1;32m'; C_YELLOW='\033[1;33m'; C_RED='\033[1;31m'
else
  C_RESET=''; C_BLUE=''; C_GREEN=''; C_YELLOW=''; C_RED=''
fi
info() { printf "${C_BLUE}▸ %s${C_RESET}\n" "$1"; }
ok()   { printf "${C_GREEN}✓ %s${C_RESET}\n" "$1"; }
warn() { printf "${C_YELLOW}! %s${C_RESET}\n" "$1"; }
err()  { printf "${C_RED}✗ %s${C_RESET}\n" "$1" >&2; }
have() { command -v "$1" >/dev/null 2>&1; }

OS="$(uname -s)"
PM=""
detect_pm() {
  case "$OS" in
    Darwin) PM="brew" ;;
    Linux)
      if   have apt-get; then PM="apt"
      elif have dnf;     then PM="dnf"
      elif have pacman;  then PM="pacman"
      else PM=""; fi ;;
    *) PM="" ;;
  esac
}

ensure_brew() {
  if ! have brew; then
    info "Homebrew не найден — устанавливаю…"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    if   [ -x /opt/homebrew/bin/brew ]; then eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -x /usr/local/bin/brew ];    then eval "$(/usr/local/bin/brew shellenv)"; fi
  fi
}

ensure_python() {
  if [ "$OS" = "Darwin" ]; then
    ensure_brew
    brew install python pipx
  else
    case "$PM" in
      apt)    warn "нужен sudo"; sudo apt-get update -y && sudo apt-get install -y python3 python3-pip pipx ;;
      dnf)    warn "нужен sudo"; sudo dnf install -y python3 python3-pip pipx ;;
      pacman) warn "нужен sudo"; sudo pacman -Sy --noconfirm python python-pipx ;;
      *) err "Не нашёл apt/dnf/pacman. Поставь Python 3 + pipx вручную: $GUIDE_URL"; exit 1 ;;
    esac
  fi
  pipx ensurepath >/dev/null 2>&1 || true
  export PATH="$HOME/.local/bin:$PATH"
  ok "Python готов ($(python3 --version 2>/dev/null || python --version))"
}

install_tools() {
  info "Ставлю LiteLLM proxy и Aider (через pipx)…"
  pipx install 'litellm[proxy]' || pipx upgrade 'litellm[proxy]' || true
  pipx install aider-chat || pipx upgrade aider-chat || true
  ok "LiteLLM + Aider готовы"
}

write_config() {
  mkdir -p "$CFG_DIR"
  local cfg="$CFG_DIR/config.yaml"
  if [ -f "$cfg" ]; then
    cp "$cfg" "$cfg.bak"
    warn "config.yaml уже есть — бэкап в config.yaml.bak, не затираю"
  else
    cat > "$cfg" <<'YAML'
model_list:
  - model_name: fast-pool
    litellm_params:
      model: cerebras/qwen-3-235b-a22b
      api_key: os.environ/CEREBRAS_API_KEY
  - model_name: balanced
    litellm_params:
      model: gemini/gemini-2.5-flash
      api_key: os.environ/GOOGLE_API_KEY
  # local-floor (llama-server :8080) — опционально, см. гайд u3 «Шаг 4»
router_settings:
  routing_strategy: simple-shuffle
  fallbacks:
    - fast-pool: ["balanced"]
YAML
    ok "config.yaml записан"
  fi
  cat > "$CFG_DIR/.env.example" <<'ENVX'
# Скопируй этот файл в .env и впиши свои ключи
CEREBRAS_API_KEY=csk-xxxxx
GOOGLE_API_KEY=AIza-xxxxx
ENVX
  cat > "$CFG_DIR/start.sh" <<'START'
#!/usr/bin/env bash
set -euo pipefail
CFG_DIR="$HOME/.config/litellm"
if [ -f "$CFG_DIR/.env" ]; then set -a; . "$CFG_DIR/.env"; set +a
else echo "Нет $CFG_DIR/.env — скопируй .env.example в .env и впиши ключи"; exit 1; fi
exec litellm --config "$CFG_DIR/config.yaml" --port 4000
START
  chmod +x "$CFG_DIR/start.sh"
  ok "launcher start.sh + .env.example готовы"
}

doctor() {
  printf "\n${C_BLUE}— Проверка —${C_RESET}\n"
  if have python3; then ok "python $(python3 --version 2>/dev/null | awk '{print $2}')"; else warn "python не найден"; fi
  if have litellm; then ok "litellm установлен"; else warn "litellm не на PATH (открой новый терминал)"; fi
  if have aider;   then ok "aider установлен";   else warn "aider не на PATH (открой новый терминал)"; fi
  printf "\n${C_GREEN}Готово!${C_RESET} Следующие шаги:\n"
  printf "  1. cp %s/.env.example %s/.env  — и впиши ключи Cerebras + Gemini\n" "$CFG_DIR" "$CFG_DIR"
  printf "  2. Запусти прокси:  %s/start.sh\n" "$CFG_DIR"
  printf "  3. Наведи Aider:    aider --model openai/fast-pool --openai-api-base http://localhost:4000\n"
  printf "     (Aider попросит OPENAI_API_KEY — впиши любое значение, напр. 'sk-local')\n"
  printf "  GUI-вариант: расширение Cline в VS Code → тот же http://localhost:4000\n"
  printf "\nПодробный гайд: %s\n" "$GUIDE_URL"
}

main() {
  printf "${C_BLUE}Точка Сборки — установка GFW/restricted-geo стека${C_RESET}\n\n"
  detect_pm
  if [ "$OS" = "Linux" ] && [ -z "$PM" ]; then
    err "Не нашёл apt/dnf/pacman. Поставь Python 3 + pipx вручную: $GUIDE_URL"; exit 1
  fi
  ensure_python
  install_tools
  write_config
  doctor
}
main "$@"
```

- [ ] **Step 2: Синтаксис.** Run: `bash -n web/public/install-gfw.sh` → exit 0. `shellcheck` если есть.
- [ ] **Step 3: Commit**
```bash
git add LMS/tochka-sborki/web/public/install-gfw.sh
git commit -m "feat(installer): install-gfw.sh — LiteLLM+Aider cloud-relay (fb_1b4b72623936)"
```

---

## Track B — Task 2: install-gfw.ps1

**Files:** Create `web/public/install-gfw.ps1`

- [ ] **Step 1: Создать файл (финальное содержимое):**

```powershell
#Requires -Version 5
# Точка Сборки — установщик GFW/restricted-geo стека (Windows 11)
# Ставит: Python + LiteLLM proxy + Aider; пишет cloud-relay конфиг.
# Использование: irm https://ai.mamaev.coach/install-gfw.ps1 | iex

$ErrorActionPreference = 'Stop'
$GuideUrl = 'https://ai.mamaev.coach/lessons/03-stack-selection'
$CfgDir = Join-Path $HOME '.config\litellm'

function Info($m) { Write-Host "▸ $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "✓ $m" -ForegroundColor Green }
function Warn($m) { Write-Host "! $m" -ForegroundColor Yellow }
function Fail($m) { Write-Host "✗ $m" -ForegroundColor Red; exit 1 }
function Have($cmd) { return [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Update-SessionPath {
  $env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' +
              [System.Environment]::GetEnvironmentVariable('Path','User')
}

Write-Host "Точка Сборки — установка GFW/restricted-geo стека`n" -ForegroundColor Cyan

if (-not (Have 'winget')) { Fail "winget не найден. Обнови «App Installer» из Microsoft Store. Гайд: $GuideUrl" }

if (-not (Have 'python')) {
  Info "Устанавливаю Python…"
  winget install --silent --accept-package-agreements --accept-source-agreements --id Python.Python.3.12
  Update-SessionPath
}
if (-not (Have 'python')) { Fail "Не удалось установить Python. Гайд: $GuideUrl" }
Ok "Python готов ($(python --version))"

Info "Ставлю pipx + LiteLLM + Aider…"
python -m pip install --user --quiet pipx
python -m pipx ensurepath | Out-Null
Update-SessionPath
python -m pipx install 'litellm[proxy]'
python -m pipx install aider-chat
Ok "LiteLLM + Aider готовы"

New-Item -ItemType Directory -Force $CfgDir | Out-Null
$cfg = Join-Path $CfgDir 'config.yaml'
if (Test-Path $cfg) { Copy-Item $cfg "$cfg.bak" -Force; Warn "config.yaml уже есть — бэкап в config.yaml.bak" }
else {
@'
model_list:
  - model_name: fast-pool
    litellm_params:
      model: cerebras/qwen-3-235b-a22b
      api_key: os.environ/CEREBRAS_API_KEY
  - model_name: balanced
    litellm_params:
      model: gemini/gemini-2.5-flash
      api_key: os.environ/GOOGLE_API_KEY
  # local-floor (llama-server :8080) — опционально, см. гайд u3 «Шаг 4»
router_settings:
  routing_strategy: simple-shuffle
  fallbacks:
    - fast-pool: ["balanced"]
'@ | Set-Content -Encoding UTF8 $cfg
  Ok "config.yaml записан"
}
@'
# Скопируй этот файл в .env и впиши свои ключи
CEREBRAS_API_KEY=csk-xxxxx
GOOGLE_API_KEY=AIza-xxxxx
'@ | Set-Content -Encoding UTF8 (Join-Path $CfgDir '.env.example')
@'
$ErrorActionPreference = "Stop"
$CfgDir = Join-Path $HOME ".config\litellm"
$envFile = Join-Path $CfgDir ".env"
if (-not (Test-Path $envFile)) { Write-Host "Нет $envFile — скопируй .env.example в .env и впиши ключи"; exit 1 }
Get-Content $envFile | ForEach-Object { if ($_ -match "^\s*([^#=]+)=(.*)$") { [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim()) } }
litellm --config (Join-Path $CfgDir "config.yaml") --port 4000
'@ | Set-Content -Encoding UTF8 (Join-Path $CfgDir 'start.ps1')
Ok "launcher start.ps1 + .env.example готовы"

Write-Host "`n— Проверка —" -ForegroundColor Cyan
if (Have 'python') { Ok "python $(python --version)" } else { Warn "python не найден" }
if (Have 'litellm') { Ok "litellm установлен" } else { Warn "litellm не на PATH (открой новый терминал)" }
if (Have 'aider') { Ok "aider установлен" } else { Warn "aider не на PATH (открой новый терминал)" }

Write-Host "`nГотово! Следующие шаги:" -ForegroundColor Green
Write-Host "  1. Скопируй $CfgDir\.env.example в .env и впиши ключи Cerebras + Gemini"
Write-Host "  2. Запусти прокси:  & $CfgDir\start.ps1"
Write-Host "  3. Наведи Aider:    aider --model openai/fast-pool --openai-api-base http://localhost:4000"
Write-Host "     (Aider попросит OPENAI_API_KEY — впиши любое значение)"
Write-Host "  GUI-вариант: расширение Cline в VS Code → тот же http://localhost:4000"
Write-Host "`nПодробный гайд: $GuideUrl"
```

- [ ] **Step 2: Parse-проверка (если pwsh есть):** `pwsh -NoProfile -Command "$null=[System.Management.Automation.Language.Parser]::ParseFile('LMS/tochka-sborki/web/public/install-gfw.ps1',[ref]$null,[ref]$null);'OK'"`
- [ ] **Step 3: Commit**
```bash
git add LMS/tochka-sborki/web/public/install-gfw.ps1
git commit -m "feat(installer): install-gfw.ps1 — LiteLLM+Aider cloud-relay для Windows (fb_1b4b72623936)"
```

---

## Track C — Task 3: content-guard тест

**Files:** Create `web/lib/installer-gfw.test.ts`

- [ ] **Step 1: Написать тест:**
```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const sh  = readFileSync(new URL('../public/install-gfw.sh',  import.meta.url), 'utf8')
const ps1 = readFileSync(new URL('../public/install-gfw.ps1', import.meta.url), 'utf8')

describe('install-gfw.sh', () => {
  it('bash shebang + строгий режим', () => {
    expect(sh.startsWith('#!/usr/bin/env bash')).toBe(true)
    expect(sh).toContain('set -euo pipefail')
  })
  it('ставит litellm+aider, config на :4000 с cerebras/gemini', () => {
    expect(sh).toMatch(/litellm/)
    expect(sh).toMatch(/aider/)
    expect(sh).toMatch(/config\.yaml/)
    expect(sh).toContain('4000')
    expect(sh).toMatch(/cerebras/)
    expect(sh).toMatch(/gemini/)
  })
  it('doctor-блок и нет плейсхолдеров', () => {
    expect(sh).toMatch(/doctor/i)
    expect(sh).not.toMatch(/TODO|FIXME|PLACEHOLDER/)
  })
})

describe('install-gfw.ps1', () => {
  it('строгий режим + winget', () => {
    expect(ps1).toContain("$ErrorActionPreference = 'Stop'")
    expect(ps1).toContain('winget')
  })
  it('ставит litellm+aider, config :4000 cerebras/gemini', () => {
    expect(ps1).toMatch(/litellm/)
    expect(ps1).toMatch(/aider/)
    expect(ps1).toContain('4000')
    expect(ps1).toMatch(/cerebras/)
    expect(ps1).toMatch(/gemini/)
  })
  it('нет плейсхолдеров', () => {
    expect(ps1).not.toMatch(/TODO|FIXME|PLACEHOLDER/)
  })
})
```

- [ ] **Step 2: Прогнать** (скрипты уже созданы → PASS). Run: `npx vitest run lib/installer-gfw.test.ts` → PASS (6).
- [ ] **Step 3: Commit**
```bash
git add LMS/tochka-sborki/web/lib/installer-gfw.test.ts
git commit -m "test(installer): content-guard для install-gfw.sh/.ps1 (fb_1b4b72623936)"
```

---

## Track D — Task 4: точка входа в u3-behind-gfw.mdx

**Files:** Modify `web/content/ru/03-stack-selection/u3-behind-gfw.mdx`, `web/content/en/03-stack-selection/u3-behind-gfw.mdx`

> Вставить В НАЧАЛО concept-фазы: после строки `<Phase type="concept">`, ПЕРЕД `## Архитектура «Behind-GFW»` (RU) / соответствующим EN-заголовком.

- [ ] **Step 1: RU — вставить блок** сразу после `<Phase type="concept">`:
```mdx

## ⚡ Быстрая установка GFW-стека (одной строкой)

Одна команда ставит LiteLLM-прокси и Aider и пишет готовый конфиг (Cerebras + Gemini Flash). Дальше останется вписать два ключа. Ниже — разбор по шагам, если хочешь понять, что происходит.

<OsToggle />

<OsBlock os="mac">

```bash
curl -fsSL https://ai.mamaev.coach/install-gfw.sh | bash
```

</OsBlock>

<OsBlock os="windows">

```powershell
irm https://ai.mamaev.coach/install-gfw.ps1 | iex
```

</OsBlock>

> 💡 На Linux работает та же команда, что и для Mac (`curl … | bash`).

После установки: впиши ключи в `~/.config/litellm/.env`, запусти `start.sh`/`start.ps1`, наведи Aider на `http://localhost:4000`.
```

- [ ] **Step 2: EN** — тот же блок в `content/en/03-stack-selection/u3-behind-gfw.mdx` после `<Phase type="concept">` (EN-текст):
```mdx

## ⚡ Quick install of the GFW stack (one line)

One command installs the LiteLLM proxy and Aider and writes a ready config (Cerebras + Gemini Flash). Then you just add two keys. The step-by-step breakdown is below if you want to understand what happens.

<OsToggle />

<OsBlock os="mac">

```bash
curl -fsSL https://ai.mamaev.coach/install-gfw.sh | bash
```

</OsBlock>

<OsBlock os="windows">

```powershell
irm https://ai.mamaev.coach/install-gfw.ps1 | iex
```

</OsBlock>

> 💡 On Linux, use the same command as Mac (`curl … | bash`).

After install: add your keys to `~/.config/litellm/.env`, run `start.sh`/`start.ps1`, point Aider at `http://localhost:4000`.
```

- [ ] **Step 3: Commit**
```bash
git add LMS/tochka-sborki/web/content/ru/03-stack-selection/u3-behind-gfw.mdx LMS/tochka-sborki/web/content/en/03-stack-selection/u3-behind-gfw.mdx
git commit -m "docs(u3): секция быстрой установки GFW-стека одной строкой (fb_1b4b72623936)"
```

---

## Task 5: Верификация + write-back (оркестратор)

- [ ] **Step 1:** `npx vitest run lib/installer-gfw.test.ts` → PASS (6).
- [ ] **Step 2:** `bash -n public/install-gfw.sh` → exit 0.
- [ ] **Step 3:** `npx vitest run` (вся LMS-сьюта) + `npx tsc --noEmit` → зелёное.
- [ ] **Step 4: Write-back** — этот тикет уже `done` (MVP). GFW — его хвост; статус НЕ меняем (тикет закрыт ранее). Зафиксировать факт в коммите.

## Ручной чеклист (автор)
- [ ] Чистый Mac/Ubuntu/Win 11: одна команда из u3 → вписать Cerebras+Gemini ключи в `.env` → `start` → Aider отвечает через `:4000`.
- [ ] `https://ai.mamaev.coach/install-gfw.sh` открывается в браузере.

## Самопроверка плана
- **Покрытие спеки:** sh (Python/pipx, litellm+aider, config.yaml+.env.example+start.sh, doctor) T1 ✓ · ps1 winget T2 ✓ · content-guard T3 ✓ · точка входа RU+EN T4 ✓ · ключи `CEREBRAS_API_KEY`+`GOOGLE_API_KEY` ✓ · Aider-only + Cline-упоминание ✓.
- **Плейсхолдеров нет** (csk-xxxxx/AIza-xxxxx — это example-значения ключей, не TODO/FIXME/PLACEHOLDER-токены).
- **Консистентность:** тест читает `../public/install-gfw.{sh,ps1}` (T3) куда пишут T1/T2; маркеры (`set -euo pipefail`, `winget`, `litellm`, `aider`, `4000`, `cerebras`, `gemini`, `doctor`) присутствуют.
```

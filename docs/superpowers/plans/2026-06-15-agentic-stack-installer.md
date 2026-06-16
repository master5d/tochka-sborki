# Auto-install скрипты agentic stack — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Захостить два идемпотентных установщика (`install.sh`, `install.ps1`), ставящих Node LTS + Git + Claude Code одной строкой под Mac/Linux/Windows (`fb_1b4b72623936`, MVP — дефолтный Claude-путь).

**Architecture:** Статик-файлы в `web/public/` → раздаются CF Pages по корню `ai.mamaev.coach`. Нативные shell-скрипты (bootstrap-парадокс: Node-утилиту нельзя запустить до Node). Проверка — content-guard vitest-тест (реальный install в CI не гоняем) + `bash -n`/shellcheck локально.

**Tech Stack:** bash, PowerShell, Vitest (env `node`), Next.js static export, CF Pages.

**Spec:** `docs/superpowers/specs/2026-06-15-agentic-stack-installer-design.md`

**Рабочая директория для путей:** `LMS/tochka-sborki/web/` (кроме корневого `02-setup-guide.md`).
**Тесты:** из `web/` → `npx vitest run <path>`.

---

## Файловые треки (непересекающиеся → безопасны параллельно)

- **Track A:** `web/public/install.sh`
- **Track B:** `web/public/install.ps1`
- **Track C:** `web/lib/installer-scripts.test.ts` (content-guard; читает файлы Track A/B — TDD: пишется первым, краснеет пока скриптов нет)
- **Track D:** точка входа в setup-guide — `02-setup-guide.md` (корень курса) + `web/content/ru/02-setup-guide/u2-install.mdx` + `web/content/en/02-setup-guide/u2-install.mdx`

Track C зелёным становится только после слияния A+B (интеграция, Task 5).

---

## Track A — Task 1: install.sh

**Files:** Create `web/public/install.sh`

- [ ] **Step 1: Создать файл с полным содержимым (финальное, не placeholder):**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Точка Сборки — установщик базового agentic stack (Mac/Linux)
# Ставит: Node.js LTS + Git + Claude Code. Идемпотентно.
# Использование: curl -fsSL https://ai.mamaev.coach/install.sh | bash

GUIDE_URL="https://ai.mamaev.coach/lessons/02-setup-guide"
NODE_MIN_MAJOR=18

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
node_major() { node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1; }

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
    info "Homebrew не найден — устанавливаю (нужен для node/git на Mac)…"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    if   [ -x /opt/homebrew/bin/brew ]; then eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -x /usr/local/bin/brew ];    then eval "$(/usr/local/bin/brew shellenv)"; fi
  fi
  ok "Homebrew готов"
}

pm_install() {
  case "$PM" in
    brew)   brew install "$@" ;;
    apt)    warn "Установка через apt требует sudo"; sudo apt-get update -y && sudo apt-get install -y "$@" ;;
    dnf)    warn "Установка через dnf требует sudo"; sudo dnf install -y "$@" ;;
    pacman) warn "Установка через pacman требует sudo"; sudo pacman -Sy --noconfirm "$@" ;;
    *) err "Неизвестный пакетный менеджер. Установи Node.js LTS и Git вручную: $GUIDE_URL"; exit 1 ;;
  esac
}

ensure_node() {
  if have node && [ "$(node_major)" -ge "$NODE_MIN_MAJOR" ] 2>/dev/null; then
    ok "Node.js уже установлен ($(node -v))"; return
  fi
  info "Устанавливаю Node.js LTS…"
  case "$PM" in
    brew)               pm_install node ;;
    apt|dnf|pacman)     pm_install nodejs npm ;;
  esac
  if have node; then ok "Node.js установлен ($(node -v))"; else err "Не удалось установить Node.js. Ручной гайд: $GUIDE_URL"; exit 1; fi
}

ensure_git() {
  if have git; then ok "Git уже установлен ($(git --version))"; return; fi
  info "Устанавливаю Git…"
  pm_install git
  if have git; then ok "Git установлен"; else err "Не удалось установить Git. Ручной гайд: $GUIDE_URL"; exit 1; fi
}

ensure_claude() {
  if have claude; then ok "Claude Code уже установлен"; return; fi
  info "Устанавливаю Claude Code (глобально, без sudo)…"
  local PREFIX="$HOME/.npm-global"
  npm config set prefix "$PREFIX"
  export PATH="$PREFIX/bin:$PATH"
  local LINE="export PATH=\"$PREFIX/bin:\$PATH\""
  for RC in "$HOME/.profile" "$HOME/.zshrc" "$HOME/.bashrc"; do
    [ -f "$RC" ] || continue
    grep -qF ".npm-global/bin" "$RC" || printf '\n# Точка Сборки — Claude Code\n%s\n' "$LINE" >> "$RC"
  done
  npm install -g @anthropic-ai/claude-code
  if have claude; then ok "Claude Code установлен"; else warn "Claude Code установлен, но не на PATH — открой новый терминал"; fi
}

doctor() {
  printf "\n${C_BLUE}— Проверка —${C_RESET}\n"
  if have node;   then ok "node  $(node -v)";                                  else warn "node не найден"; fi
  if have git;    then ok "git   $(git --version | awk '{print $3}')";         else warn "git не найден"; fi
  if have claude; then ok "claude установлен";                                 else warn "claude не на PATH (открой новый терминал)"; fi
  printf "\n${C_GREEN}Готово!${C_RESET} Следующие шаги:\n"
  printf "  1. Открой НОВЫЙ терминал (чтобы подхватился PATH)\n"
  printf "  2. Запусти:  claude\n"
  printf "  3. Залогинься по ссылке, которую он покажет\n"
  printf "\nПодробный гайд: %s\n" "$GUIDE_URL"
}

main() {
  printf "${C_BLUE}Точка Сборки — установка agentic stack${C_RESET}\n\n"
  detect_pm
  [ "$OS" = "Darwin" ] && ensure_brew
  if [ "$OS" = "Linux" ] && [ -z "$PM" ]; then
    err "Не нашёл apt/dnf/pacman. Установи Node.js LTS и Git вручную: $GUIDE_URL"; exit 1
  fi
  ensure_node
  ensure_git
  ensure_claude
  doctor
}
main "$@"
```

- [ ] **Step 2: Синтаксис-проверка**

Run: `bash -n web/public/install.sh`
Expected: без вывода (exit 0). Если есть `shellcheck`: `shellcheck web/public/install.sh` — без error-уровня.

- [ ] **Step 3: Commit**

```bash
git add LMS/tochka-sborki/web/public/install.sh
git commit -m "feat(installer): install.sh — Node+Git+Claude Code для Mac/Linux (fb_1b4b72623936)"
```

---

## Track B — Task 2: install.ps1

**Files:** Create `web/public/install.ps1`

- [ ] **Step 1: Создать файл с полным содержимым (финальное):**

```powershell
#Requires -Version 5
# Точка Сборки — установщик базового agentic stack (Windows 11)
# Ставит: Node.js LTS + Git + Claude Code. Идемпотентно.
# Использование: irm https://ai.mamaev.coach/install.ps1 | iex

$ErrorActionPreference = 'Stop'
$GuideUrl = 'https://ai.mamaev.coach/lessons/02-setup-guide'

function Info($m) { Write-Host "▸ $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "✓ $m" -ForegroundColor Green }
function Warn($m) { Write-Host "! $m" -ForegroundColor Yellow }
function Fail($m) { Write-Host "✗ $m" -ForegroundColor Red; exit 1 }
function Have($cmd) { return [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Update-SessionPath {
  $env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' +
              [System.Environment]::GetEnvironmentVariable('Path','User')
}

Write-Host "Точка Сборки — установка agentic stack`n" -ForegroundColor Cyan

if (-not (Have 'winget')) {
  Fail "winget не найден. Обнови «App Installer» из Microsoft Store, затем повтори. Ручной гайд: $GuideUrl"
}

if (Have 'node') { Ok "Node.js уже установлен ($(node -v))" }
else {
  Info "Устанавливаю Node.js LTS…"
  winget install --silent --accept-package-agreements --accept-source-agreements --id OpenJS.NodeJS.LTS
  Update-SessionPath
  if (Have 'node') { Ok "Node.js установлен ($(node -v))" } else { Fail "Не удалось установить Node.js. Гайд: $GuideUrl" }
}

if (Have 'git') { Ok "Git уже установлен ($(git --version))" }
else {
  Info "Устанавливаю Git…"
  winget install --silent --accept-package-agreements --accept-source-agreements --id Git.Git
  Update-SessionPath
  if (Have 'git') { Ok "Git установлен" } else { Fail "Не удалось установить Git. Гайд: $GuideUrl" }
}

if (Have 'claude') { Ok "Claude Code уже установлен" }
else {
  Info "Устанавливаю Claude Code…"
  npm install -g '@anthropic-ai/claude-code'
  Update-SessionPath
  if (Have 'claude') { Ok "Claude Code установлен" } else { Warn "Claude Code установлен, но не на PATH — открой новый терминал" }
}

Write-Host "`n— Проверка —" -ForegroundColor Cyan
if (Have 'node')   { Ok "node  $(node -v)" }   else { Warn "node не найден" }
if (Have 'git')    { Ok "git   $((git --version) -replace 'git version ','')" } else { Warn "git не найден" }
if (Have 'claude') { Ok "claude установлен" }   else { Warn "claude не на PATH (открой новый терминал)" }

Write-Host "`nГотово! Следующие шаги:" -ForegroundColor Green
Write-Host "  1. Открой НОВЫЙ терминал (PowerShell)"
Write-Host "  2. Запусти:  claude"
Write-Host "  3. Залогинься по ссылке"
Write-Host "`nПодробный гайд: $GuideUrl"
```

- [ ] **Step 2: Синтаксис-проверка (если доступен pwsh)**

Run: `pwsh -NoProfile -Command "$null = [System.Management.Automation.Language.Parser]::ParseFile('LMS/tochka-sborki/web/public/install.ps1', [ref]$null, [ref]$null); 'OK'"`
Expected: `OK` без parse-ошибок. (Если pwsh нет — пропустить, проверит content-guard тест + ручной прогон.)

- [ ] **Step 3: Commit**

```bash
git add LMS/tochka-sborki/web/public/install.ps1
git commit -m "feat(installer): install.ps1 — Node+Git+Claude Code для Windows (fb_1b4b72623936)"
```

---

## Track C — Task 3: content-guard тест

**Files:** Create `web/lib/installer-scripts.test.ts`

> Кладём в `lib/`, НЕ в `public/` — иначе Next-export скопирует тест в публичную раздачу. Читаем скрипты из `../public/`.

- [ ] **Step 1: Написать тест (TDD — упадёт, пока скриптов нет):**

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const sh  = readFileSync(new URL('../public/install.sh',  import.meta.url), 'utf8')
const ps1 = readFileSync(new URL('../public/install.ps1', import.meta.url), 'utf8')

describe('install.sh', () => {
  it('bash shebang + строгий режим', () => {
    expect(sh.startsWith('#!/usr/bin/env bash')).toBe(true)
    expect(sh).toContain('set -euo pipefail')
  })
  it('ставит node, git и Claude Code через brew/apt', () => {
    expect(sh).toContain('@anthropic-ai/claude-code')
    expect(sh).toMatch(/brew/)
    expect(sh).toMatch(/apt/)
    expect(sh).toMatch(/ensure_git/)
  })
  it('есть doctor-блок и нет плейсхолдеров', () => {
    expect(sh).toMatch(/doctor/i)
    expect(sh).not.toMatch(/TODO|FIXME|PLACEHOLDER/)
  })
})

describe('install.ps1', () => {
  it('строгий режим + winget', () => {
    expect(ps1).toContain("$ErrorActionPreference = 'Stop'")
    expect(ps1).toContain('winget')
  })
  it('ставит node, git и Claude Code', () => {
    expect(ps1).toContain('OpenJS.NodeJS.LTS')
    expect(ps1).toContain('Git.Git')
    expect(ps1).toContain('@anthropic-ai/claude-code')
  })
  it('нет плейсхолдеров', () => {
    expect(ps1).not.toMatch(/TODO|FIXME|PLACEHOLDER/)
  })
})
```

- [ ] **Step 2: Запустить — убедиться, что падает (скриптов ещё нет в этом worktree)**

Run: `npx vitest run lib/installer-scripts.test.ts`
Expected: FAIL — `ENOENT` на чтении `install.sh`. (После слияния треков — PASS, см. Task 5.)

- [ ] **Step 3: Commit**

```bash
git add LMS/tochka-sborki/web/lib/installer-scripts.test.ts
git commit -m "test(installer): content-guard для install.sh/.ps1 (fb_1b4b72623936)"
```

---

## Track D — Task 4: точка входа «Быстрая установка»

**Files:** Modify `02-setup-guide.md` (корень курса), `web/content/ru/02-setup-guide/u2-install.mdx`, `web/content/en/02-setup-guide/u2-install.mdx`

> Сначала прочитать `u2-install.mdx` (RU) — увидеть, как файл уже использует `<OsBlock os="mac|windows">`, и вставить блок В ТОМ ЖЕ стиле в начало юнита (перед ручной пошаговой установкой).

- [ ] **Step 1: Вставить секцию в `web/content/ru/02-setup-guide/u2-install.mdx`** (в начало, после frontmatter/заголовка, перед ручными шагами):

```mdx
## ⚡ Быстрая установка (одной строкой)

Если хочешь сразу рабочую лабораторию — выполни одну команду в терминале. Она поставит Node.js, Git и Claude Code и проверит результат. Если что-то пойдёт не так — ниже есть пошаговый путь.

<OsBlock os="mac">

```bash
curl -fsSL https://ai.mamaev.coach/install.sh | bash
```

</OsBlock>

<OsBlock os="windows">

```powershell
irm https://ai.mamaev.coach/install.ps1 | iex
```

</OsBlock>

> 💡 На Linux работает та же команда, что и для Mac (`curl … | bash`).

После установки открой **новый** терминал и запусти `claude`.
```

- [ ] **Step 2: Зеркало в `web/content/en/02-setup-guide/u2-install.mdx`** (тот же блок, EN-текст):

```mdx
## ⚡ Quick install (one line)

Want a working lab right away? Run one command in your terminal. It installs Node.js, Git, and Claude Code, then verifies the result. If anything goes wrong, the step-by-step path is below.

<OsBlock os="mac">

```bash
curl -fsSL https://ai.mamaev.coach/install.sh | bash
```

</OsBlock>

<OsBlock os="windows">

```powershell
irm https://ai.mamaev.coach/install.ps1 | iex
```

</OsBlock>

> 💡 On Linux, use the same command as Mac (`curl … | bash`).

After it finishes, open a **new** terminal and run `claude`.
```

- [ ] **Step 3: Добавить краткий блок в корневой `02-setup-guide.md`** (после раздела «Цель встречи», перед «Рефлексия: Боль установки»):

```markdown
## ⚡ Быстрая установка (одной строкой)

Нетехнический путь — одна команда ставит весь базовый стек (Node.js + Git + Claude Code):

- **Mac / Linux:** `curl -fsSL https://ai.mamaev.coach/install.sh | bash`
- **Windows:** `irm https://ai.mamaev.coach/install.ps1 | iex`

Если установщик выдал ошибку — ниже пошаговый ручной путь.
```

- [ ] **Step 4: Commit**

```bash
git add "LMS/tochka-sborki/02-setup-guide.md" LMS/tochka-sborki/web/content/ru/02-setup-guide/u2-install.mdx LMS/tochka-sborki/web/content/en/02-setup-guide/u2-install.mdx
git commit -m "docs(setup): секция быстрой установки одной строкой (fb_1b4b72623936)"
```

---

## Task 5: Интеграционная верификация (оркестратор после слияния треков)

- [ ] **Step 1: Content-guard тест зелёный**

Run: `npx vitest run lib/installer-scripts.test.ts`
Expected: PASS (6 тестов).

- [ ] **Step 2: Синтаксис скриптов**

Run: `bash -n public/install.sh` → exit 0. Если есть `shellcheck`/`pwsh` — прогнать (Task1 Step2 / Task2 Step2).

- [ ] **Step 3: Полная сьюта (нет регрессий)**

Run: `npx vitest run`
Expected: вся существующая сьюта + новый тест зелёные.

- [ ] **Step 4: Sanity сборки (раздача статик-файлов)**

Run: `npx tsc --noEmit`
Expected: без ошибок типов (тест — TS). (`install.sh`/`.ps1` — не-TS, сборку не трогают.)

- [ ] **Step 5: Write-back статуса тикета**

```bash
node feedback/scripts/fb.mjs status fb_1b4b72623936 done
git add feedback/feedback.jsonl feedback/board.canvas
git commit -m "chore(feedback): fb_1b4b72623936 done — auto-install скрипты (MVP)"
```

---

## Ручной чеклист (НЕ автоматизируется — для автора)

- [ ] Чистый Mac: `curl … install.sh | bash` доводит до рабочего `claude --version`.
- [ ] Чистый Ubuntu (apt): то же.
- [ ] Чистый Windows 11 (winget): `irm … install.ps1 | iex` доводит до рабочего `claude`.
- [ ] Повторный запуск идемпотентен (пропускает установленное).
- [ ] Файлы реально отдаются: `https://ai.mamaev.coach/install.sh` открывается в браузере.

## Самопроверка плана
- **Покрытие спеки:** install.sh Mac+Linux(apt/dnf/pacman+fallback, brew, no-sudo npm prefix) T1 ✓ · install.ps1 winget T2 ✓ · content-guard тест T3 ✓ · точка входа RU+EN+root T4 ✓ · doctor-блоки ✓ · идемпотентность ✓ · write-back T5 ✓ · ручной чеклист ✓.
- **Плейсхолдеров нет:** скрипты и тексты финальные.
- **Консистентность:** тест читает `../public/install.sh`/`.ps1` (T3) ровно туда, куда пишут T1/T2; маркеры теста (`set -euo pipefail`, `OpenJS.NodeJS.LTS`, `Git.Git`, `@anthropic-ai/claude-code`, `ensure_git`, `doctor`) присутствуют в скриптах.

# Onboarding Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** После первого входа показывать learner'у страницу /onboarding/ с вопросом про OS (Mac/Windows), сохранять выбор в localStorage, и адаптировать MDX-контент через компонент `<OsBlock>`.

**Architecture:** Статический Next.js 16 (`output: 'export'`). OS хранится в `localStorage.getItem('os')` (`'mac'` | `'windows'`). `verify-client.tsx` проверяет localStorage после успешного verify — если OS не выбрана, редиректит на `/onboarding/` вместо первого урока. `OsBlock` — клиентский компонент, читает localStorage и рендерит или скрывает children. Nav получает pill-переключатель Mac🍎/Win🪟 для смены OS после онбординга.

**Tech Stack:** Next.js 16 App Router, TypeScript, React 18, Vitest (существующий тест-раннер `web/lib/content.test.ts`).

---

## File Structure

| Действие | Файл | Назначение |
|----------|------|------------|
| Создать | `web/components/os-block.tsx` | Клиентский компонент: читает localStorage.os, скрывает non-matching children |
| Изменить | `web/components/mdx-components.tsx` | Зарегистрировать OsBlock как MDX-компонент |
| Создать | `web/app/onboarding/page.tsx` | Страница wizard: выбор OS, сохранение в localStorage, редирект |
| Изменить | `web/app/auth/verify/verify-client.tsx` | После verify: редирект на /onboarding/ если localStorage.os не установлен |
| Изменить | `web/components/nav.tsx` | OS chip: pill Mac🍎/Win🪟, меняет localStorage.os и перезагружает страницу |
| Изменить | `web/content/ru/02-setup-guide.mdx` | Обернуть OS-специфичный jq install блок в OsBlock |

---

## Task 1: OsBlock component

**Files:**
- Create: `web/components/os-block.tsx`
- Modify: `web/components/mdx-components.tsx`

- [ ] **Step 1: Создать компонент**

Создай файл `web/components/os-block.tsx` с этим содержимым:

```tsx
'use client'

interface Props {
  os: 'mac' | 'windows'
  children: React.ReactNode
}

export function OsBlock({ os, children }: Props) {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('os') : null
  if (stored && stored !== os) return null
  return <>{children}</>
}
```

Логика: если `localStorage.os` не установлен (wizard не пройден) — показываем оба блока (graceful fallback). Если установлен и не совпадает с пропом `os` — возвращаем null. SSR-безопасен через `typeof window !== 'undefined'`.

- [ ] **Step 2: Зарегистрировать в mdx-components.tsx**

Открой `web/components/mdx-components.tsx`. Добавь импорт в самый верх (после существующего импорта):

```tsx
import { OsBlock } from './os-block'
```

Добавь в объект `mdxComponents` (после поля `td:`):

```tsx
  OsBlock,
```

Итоговый конец файла должен выглядеть так:

```tsx
  td: ({ children }) => (
    <td style={{ borderBottom: '1px solid var(--border-color)', padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}>{children}</td>
  ),
  OsBlock,
}
```

- [ ] **Step 3: Проверить что существующие тесты проходят**

```bash
cd web && npx vitest run
```

Ожидаемый результат: все тесты PASS (тесты в `web/lib/content.test.ts` не затронуты этим изменением).

- [ ] **Step 4: Закоммитить**

```bash
git add web/components/os-block.tsx web/components/mdx-components.tsx
git commit -m "feat: add OsBlock MDX component for OS-specific content"
```

---

## Task 2: Onboarding page

**Files:**
- Create: `web/app/onboarding/page.tsx`

- [ ] **Step 1: Создать страницу**

Создай файл `web/app/onboarding/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'

const cardStyle = (selected: boolean): React.CSSProperties => ({
  padding: '1.5rem',
  border: selected ? '2px solid var(--text-accent)' : '1px solid var(--border-color)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  textAlign: 'center',
  background: selected ? 'color-mix(in srgb, var(--text-accent) 8%, var(--bg-primary))' : 'var(--bg-surface)',
  transition: 'border-color 0.15s, background 0.15s',
})

export default function OnboardingPage() {
  const router = useRouter()
  const [os, setOs] = useState<'mac' | 'windows' | null>(null)

  useEffect(() => {
    if (localStorage.getItem('os')) {
      router.replace('/lessons/00-kickstart/')
    }
  }, [router])

  function handleSelect(value: 'mac' | 'windows') {
    setOs(value)
  }

  function handleStart() {
    if (!os) return
    localStorage.setItem('os', os)
    router.replace('/lessons/00-kickstart/')
  }

  return (
    <>
      <Nav />
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--text-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '1rem',
        }}>
          ⬡ Шаг 1 из 1
        </div>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          lineHeight: 0.95,
          marginBottom: '1rem',
        }}>
          На чём<br />работаешь?
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Покажем правильные команды и настройки для твоей системы
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div style={cardStyle(os === 'mac')} onClick={() => handleSelect('mac')}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🍎</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>macOS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Mac / MacBook</div>
          </div>
          <div style={cardStyle(os === 'windows')} onClick={() => handleSelect('windows')}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🪟</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Windows</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>WSL / PowerShell</div>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={!os}
          style={{
            width: '100%',
            padding: '0.875rem 2rem',
            background: os ? 'var(--text-accent)' : 'var(--bg-surface)',
            color: os ? '#000' : 'var(--text-secondary)',
            fontWeight: 900,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-color)',
            cursor: os ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          Начать курс →
        </button>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          Можно изменить позже в настройках
        </p>
      </main>
    </>
  )
}
```

**Важно:** `AuthGuard` здесь не нужен — страница `/onboarding/` защищена через redirect из `verify-client.tsx` (туда попадают только через verify flow). Анонимный пользователь просто не получит туда ссылку.

- [ ] **Step 2: Проверить сборку**

```bash
cd web && npm run build 2>&1 | tail -20
```

Ожидаемый результат: no errors, `/onboarding` появляется в списке сгенерированных страниц.

- [ ] **Step 3: Закоммитить**

```bash
git add web/app/onboarding/page.tsx
git commit -m "feat: add /onboarding/ wizard page for OS selection"
```

---

## Task 3: verify-client.tsx — редирект на /onboarding/

**Files:**
- Modify: `web/app/auth/verify/verify-client.tsx:21-27`

Текущий код (строки 21–27):

```ts
if (r.ok) {
  setStatus('success')
  const redirect = sessionStorage.getItem('login_redirect') || '/lessons/00-kickstart/'
  sessionStorage.removeItem('login_redirect')
  setTimeout(() => router.replace(redirect), 800)
}
```

- [ ] **Step 1: Обновить логику редиректа**

Замени блок `if (r.ok)` на следующий:

```ts
if (r.ok) {
  setStatus('success')
  const os = localStorage.getItem('os')
  const savedRedirect = sessionStorage.getItem('login_redirect')
  sessionStorage.removeItem('login_redirect')
  const destination = !os
    ? '/onboarding/'
    : (savedRedirect || '/lessons/00-kickstart/')
  setTimeout(() => router.replace(destination), 800)
}
```

Логика: если `localStorage.os` не установлен — редирект на `/onboarding/`. Если уже есть — используем сохранённый redirect или первый урок как раньше.

- [ ] **Step 2: Проверить сборку**

```bash
cd web && npm run build 2>&1 | tail -10
```

Ожидаемый результат: no errors.

- [ ] **Step 3: Закоммитить**

```bash
git add web/app/auth/verify/verify-client.tsx
git commit -m "feat: redirect to /onboarding/ after first login if OS not selected"
```

---

## Task 4: Nav OS chip

**Files:**
- Modify: `web/components/nav.tsx`

Текущий `nav.tsx` уже является клиентским компонентом с `useState` и `useEffect` для email. Добавим аналогичный стейт для OS.

- [ ] **Step 1: Обновить nav.tsx**

Замени весь файл `web/components/nav.tsx` на:

```tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export function Nav() {
  const [email, setEmail] = useState<string | null>(null)
  const [os, setOs] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.email) setEmail(d.email) })
      .catch(() => {})
    setOs(localStorage.getItem('os'))
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setEmail(null)
    window.location.replace('/')
  }

  function toggleOs() {
    const next = os === 'mac' ? 'windows' : 'mac'
    localStorage.setItem('os', next)
    setOs(next)
    window.location.reload()
  }

  return (
    <nav style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)',
      padding: '0 1.5rem',
      height: '3rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <Link href="/" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', fontWeight: 700 }}>
        ⬡ Точка Сборки
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', alignItems: 'center' }}>
        <Link href="/roadmap/" style={{ color: 'var(--text-secondary)' }}>Roadmap</Link>
        <Link href="/cheatsheet/" style={{ color: 'var(--text-secondary)' }}>Шпаргалка</Link>
        <Link href="/feedback/" style={{ color: 'var(--text-secondary)' }}>Фидбек</Link>
        {os && (
          <button
            onClick={toggleOs}
            title="Сменить OS"
            style={{
              display: 'flex',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              overflow: 'hidden',
              cursor: 'pointer',
              padding: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
            }}
          >
            <span style={{
              padding: '3px 8px',
              background: os === 'mac' ? 'var(--text-accent)' : 'transparent',
              color: os === 'mac' ? '#000' : 'var(--text-secondary)',
              fontWeight: os === 'mac' ? 700 : 400,
            }}>🍎</span>
            <span style={{
              padding: '3px 8px',
              background: os === 'windows' ? 'var(--text-accent)' : 'transparent',
              color: os === 'windows' ? '#000' : 'var(--text-secondary)',
              fontWeight: os === 'windows' ? 700 : 400,
            }}>🪟</span>
          </button>
        )}
        {email ? (
          <>
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
              {email}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Выйти
            </button>
          </>
        ) : (
          <Link href="/login/" style={{ color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>→ Войти</Link>
        )}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Проверить сборку**

```bash
cd web && npm run build 2>&1 | tail -10
```

Ожидаемый результат: no errors.

- [ ] **Step 3: Закоммитить**

```bash
git add web/components/nav.tsx
git commit -m "feat: add OS toggle chip to Nav"
```

---

## Task 5: Обновить 02-setup-guide.mdx — OsBlock

**Files:**
- Modify: `web/content/ru/02-setup-guide.mdx:473-482`

Сейчас строки 473–482 содержат:

```mdx
```bash
# Установи jq (для парсинга JSON)
# На macOS:
brew install jq

# На Windows (WSL):
sudo apt-get install jq

# На Linux:
sudo apt-get install jq
```
```

- [ ] **Step 1: Заменить на OsBlock-варианты**

Найди этот блок (поиск по `brew install jq`) и замени на:

```mdx
<OsBlock os="mac">

```bash
brew install jq
```

</OsBlock>

<OsBlock os="windows">

```bash
sudo apt-get install jq
```

</OsBlock>

<OsBlock os="mac">

```bash
# Или через Homebrew если не на WSL:
# brew install jq
```

</OsBlock>
```

```mdx
<OsBlock os="mac">

```bash
# Установи jq (для парсинга JSON)
brew install jq
```

</OsBlock>

<OsBlock os="windows">

```bash
# Установи jq (WSL / Ubuntu)
sudo apt-get install jq
```

</OsBlock>
```

**Важно:** Между открывающим тегом `<OsBlock os="mac">` и тройными обратными кавычками должна быть пустая строка — иначе MDX не распознает code block внутри компонента.

- [ ] **Step 2: Проверить сборку**

```bash
cd web && npm run build 2>&1 | tail -20
```

Ожидаемый результат: no errors.

- [ ] **Step 3: Закоммитить**

```bash
git add web/content/ru/02-setup-guide.mdx
git commit -m "content: wrap jq install in OsBlock for Mac/Windows"
```

---

## Task 6: Интеграционное тестирование в браузере

**Files:** нет изменений кода

- [ ] **Step 1: Запустить dev сервер**

```bash
cd web && npm run dev
```

Сервер будет доступен на http://localhost:3000.

- [ ] **Step 2: Протестировать wizard flow (новый пользователь)**

1. Открой DevTools → Application → Local Storage → очисти `os` если есть
2. Перейди на http://localhost:3000/auth/verify?token=fake (получишь ошибку верификации — это нормально)
3. Вместо этого: вручную перейди на http://localhost:3000/onboarding/
4. Убедись что страница отображается корректно (заголовок "На чём работаешь?", две карточки, кнопка задизейблена)
5. Кликни карточку "Windows" — карточка выделяется, кнопка активируется
6. Кликни "Начать курс →" — должен произойти редирект на `/lessons/00-kickstart/`
7. В DevTools → Local Storage: убедись что `os = "windows"`

- [ ] **Step 3: Протестировать Nav chip**

1. После шага выше — перейди на любой урок
2. В Nav должен появиться pill-переключатель 🍎 | 🪟 (🪟 подсвечен)
3. Кликни на 🍎 — страница перезагружается, теперь 🍎 подсвечен
4. В DevTools → Local Storage: `os = "mac"`

- [ ] **Step 4: Протестировать OsBlock в setup guide**

1. Перейди на http://localhost:3000/lessons/02-setup-guide/
2. Найди секцию про jq
3. Убедись что видишь только Mac-вариант (`brew install jq`)
4. Переключись на Windows через Nav chip — страница перезагружается
5. Теперь видишь только Windows-вариант (`sudo apt-get install jq`)

- [ ] **Step 5: Протестировать повторный вход (wizard не показывается)**

1. `localStorage.os` установлен (из предыдущих шагов)
2. Перейди на http://localhost:3000/onboarding/ напрямую
3. Страница должна немедленно сделать redirect на `/lessons/00-kickstart/` (wizard skip)

- [ ] **Step 6: Push и деплой**

```bash
git push origin main
```

CI/CD задеплоит на Cloudflare Pages автоматически. Проверь Actions tab в GitHub.

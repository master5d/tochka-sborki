# Onboarding Wizard — Design Spec

## Goal

После первого входа спросить learner'а про операционную систему (Windows / macOS) и адаптировать контент курса, показывая только релевантные команды и настройки.

## Architecture

Статический Next.js 16 (`output: 'export'`). OS-выбор хранится в `localStorage` на клиенте. Никаких новых API endpoints не нужно. Wizard — обычная страница `/onboarding/`, защищённая `AuthGuard`.

---

## User Flow

```
magic link click
       ↓
/auth/verify (существующий verify-client.tsx)
       ↓
  localStorage.os существует?
    ДА → редирект на сохранённый redirect или /lessons/00-kickstart/
    НЕТ → редирект на /onboarding/
       ↓
/onboarding/ — learner выбирает Mac / Windows
       ↓
localStorage.setItem('os', 'mac' | 'windows')
       ↓
router.replace('/lessons/00-kickstart/')
```

При последующих входах `localStorage.os` уже есть → wizard не показывается.

---

## Pages & Components

### `/onboarding/` (новая страница)

**Файл:** `web/app/onboarding/page.tsx`

- Обёрнута в `AuthGuard` (неавторизованные → /login/)
- Проверяет `localStorage.os` при монтировании: если уже есть → `router.replace('/lessons/00-kickstart/')` (защита от повторного посещения)
- Показывает две карточки: 🍎 macOS / 🪟 Windows
- При клике на карточку: сохраняет выбор в localStorage, редиректит на первый урок
- Кнопка "Начать курс →" активируется только после выбора карточки

**UI-текст:**
- Лейбл: `⬡ Шаг 1 из 1`
- Заголовок: `На чём работаешь?`
- Подзаголовок: `Покажем правильные команды и настройки для твоей системы`
- Сноска под кнопкой: `Можно изменить позже в настройках`

### `AuthGuard` (изменение)

**Файл:** `web/components/auth-guard.tsx`

Без изменений — wizard защищён через AuthGuard как и уроки.

### `verify-client.tsx` (изменение)

**Файл:** `web/app/auth/verify/verify-client.tsx`

После успешной верификации:
```ts
const os = localStorage.getItem('os')
const savedRedirect = sessionStorage.getItem('login_redirect')
sessionStorage.removeItem('login_redirect')

if (!os) {
  router.replace('/onboarding/')
} else {
  router.replace(savedRedirect || '/lessons/00-kickstart/')
}
```

### `<OsBlock>` (новый MDX-компонент)

**Файл:** `web/components/os-block.tsx`

```tsx
'use client'
interface Props { os: 'mac' | 'windows'; children: React.ReactNode }

export function OsBlock({ os, children }: Props) {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('os') : null
  if (stored && stored !== os) return null
  return <>{children}</>
}
```

- Если `localStorage.os` не установлен — показывает оба блока (graceful fallback для пользователей без wizard)
- Зарегистрировать в `web/components/mdx-components.tsx` как `OsBlock`

### `Nav` (изменение)

**Файл:** `web/components/nav.tsx`

Добавить OS chip между ссылками и email пользователя:

```tsx
const [os, setOs] = useState<string | null>(null)

useEffect(() => {
  setOs(localStorage.getItem('os'))
}, [])

function toggleOs() {
  const next = os === 'mac' ? 'windows' : 'mac'
  localStorage.setItem('os', next)
  setOs(next)
  window.location.reload() // пересчитать OsBlock'и
}
```

Визуально: pill-переключатель `🍎 | 🪟 Win` (активная сторона подсвечена акцентным цветом). Показывается только если `os !== null` (т.е. wizard пройден).

---

## MDX Authoring Convention

В `.mdx`-файлах OS-специфичные блоки оборачиваются компонентом:

```mdx
<OsBlock os="mac">

```bash
brew install node
```

</OsBlock>

<OsBlock os="windows">

```bash
winget install OpenJS.NodeJS
```

</OsBlock>
```

**Где применять:** только в уроках, где команды реально отличаются по OS. На сегодня это прежде всего `02-setup-guide.mdx`. Остальные уроки (промпт-инжиниринг, контекст, агенты) OS-neutral и не требуют изменений.

---

## localStorage Schema

| Ключ | Значение | Описание |
|------|----------|----------|
| `os` | `"mac"` \| `"windows"` | OS learner'а, устанавливается на /onboarding/ |

---

## Edge Cases

- **Learner открывает урок напрямую (сессия активна, wizard не пройден):** `OsBlock` показывает оба варианта (fallback). Wizard не форсируется принудительно при каждом посещении урока — только после verify flow. Это приемлемо: если learner каким-то образом миновал wizard, контент остаётся читаемым.
- **Learner очищает localStorage:** Оба OS-блока снова видны, wizard снова появится при следующем входе.
- **SSR / статическая сборка:** `OsBlock` оборачивает `localStorage` в `typeof window !== 'undefined'` → нет ошибок при build.

---

## What Is NOT in Scope

- Хранение OS в D1 / auth worker — нет необходимости, localStorage достаточно
- Больше одного вопроса в wizard — YAGNI, можно добавить позже
- Server-side rendering по OS — сайт статический, невозможно
- Отдельные MDX-файлы per OS — избыточно, inline `<OsBlock>` достаточно

---

## Files to Create / Modify

| Действие | Файл |
|----------|------|
| Создать | `web/app/onboarding/page.tsx` |
| Создать | `web/components/os-block.tsx` |
| Изменить | `web/app/auth/verify/verify-client.tsx` |
| Изменить | `web/components/nav.tsx` |
| Изменить | `web/components/mdx-components.tsx` |
| Изменить | `web/content/ru/02-setup-guide.mdx` |

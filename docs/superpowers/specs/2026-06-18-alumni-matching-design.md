# Post-course group projects + alumni matching — design pass (NOT built)

**Тикет:** `fb_7fdd9f891109` (feature, area lms, impact 7) — выбор группового проекта + alumni-матчинг по интересам.
**Дата:** 2026-06-18
**Статус:** design-pass. **Заблокировано:** продуктовое решение (нужен ли cohort-слой на self-paced курсе) + дизайн матчинга.

## Контекст
Курс **self-paced, all-open, бесплатный**; нет когорт/дедлайнов. Есть: `users`+`intake_profiles` (D1, ниша/outcome/skin), feedback-петля. Матчинг «по интересам» = переиспользовать intake-профиль (niche, F3-outcome, aspiration).

## Подход (когда разблокируют) — фазами, от лёгкого
**Фаза A — opt-in «directory» (минимум backend):**
- Кнопка на `/certificate` или `/character`: «Открыть профиль для alumni-нетворкинга» → флаг `users.alumni_optin` + публичные поля (имя/ника, niche, outcome, контакт). Миграция `alumni_optin`, `alumni_contact`.
- Эндпоинт `GET /api/alumni` (только для залогиненных opt-in) → список opt-in профилей. Страница `/alumni` с фильтром по нише.
- **Матчинг = клиентская группировка по niche/outcome** (детерминированно, без ML): «рядом с тобой по нише — N человек».

**Фаза B — групповые проекты:**
- Реестр предложенных групповых проектов (как `materials.ts` манифест) + opt-in «хочу в проект X». Матчинг = по проекту + нише.

## Решения за владельцем (разблокировка)
1. **Нужен ли cohort-слой** на принципиально self-paced курсе, или это противоречит формату? (главное product-решение).
2. **Приватность** — что показываем (имя/контакт/соцсети)? GDPR/согласие. Аутентичность-граница аудитории (см. [[project_tochka_sborki_funnel]]) — нетворкинг должен быть искренним, не «нетворкинг ради нетворкинга».
3. **Матчинг** — простая группировка по нише (рекомендую старт) или сложнее (взаимные интересы, скоринг)?

## Guardrails
- Строгий opt-in + видимость только для других opt-in alumni. PII по согласию.
- Никакого авто-представления/спама; контакт инициирует человек.

## Вне scope (сейчас)
- Реал-тайм чат/сообщения внутри платформы (→ внешние каналы: TG/email).
- ML-матчинг, рекомендательные системы.

## Phase A — BUILT 2026-06-18 (code shipped, awaiting prod activation)
Реализовано: миграция `0007_alumni_optin.sql` (additive: `alumni_optin`/`alumni_contact`/`alumni_blurb`), worker-эндпоинты `GET /api/alumni` · `GET /api/alumni/me` · `POST /api/alumni/optin` (`requireAuth`, defensive — degrade to empty/503 если миграция не применена → прод не 500-ит), страница `/alumni` (RU+EN, gated→login) c opt-in формой + directory по нишам (email НЕ показывается, только chosen contact + blurb). `/alumni` в robots disallow.

**GO-LIVE (твои шаги активации — НЕ сделаны намеренно):**
1. Применить миграцию к прод D1: `cd workers && npx wrangler d1 execute tochka-sborki-db --remote --file migrations/0007_alumni_optin.sql` (нужен токен с D1 Edit — см. [[reference_tochka_d1_account]]).
2. Добавить nav-ссылку на `/alumni` (намеренно отложена — до миграции opt-in вернёт 503). Тогда фича видима и рабочая.

## Готовность к build
Фаза A спроектирована; нужен go на сам cohort-слой + приватность-решение. Тогда: миграция (opt-in поля) → `/api/alumni` (TDD) → `/alumni` страница → группировка по нише.

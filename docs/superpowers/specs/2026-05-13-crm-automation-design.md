# CRM Automation — Design Spec
_2026-05-13_

## Goal

Automatically capture every new student registration into a Notion CRM database with language segmentation, UTM source tracking, and optional Telegram handle — enabling manual outreach in the student's language via Resend.

## Architecture

```
/login page  ──UTM + telegram──▶  handleSendLink  ──new user──▶  n8n webhook
                                        │                              │
                               D1 users (enriched)            Notion: Students DB
```

Worker detects language from `Accept-Language` header, persists enriched data to D1, then calls a dedicated n8n webhook only for new users. n8n creates the Notion record. Existing users re-logging in are silently ignored by the CRM pipeline.

## Components

### 1. D1 Migration `0002_crm_fields.sql`

Adds three nullable columns to `users`:

```sql
ALTER TABLE users ADD COLUMN language TEXT;
ALTER TABLE users ADD COLUMN source TEXT;
ALTER TABLE users ADD COLUMN telegram_handle TEXT;
```

All nullable — existing rows and returning users are unaffected.

### 2. Login Form (`web/app/login/page.tsx`)

- Add optional `@username` Telegram input (below email, labelled "Telegram (необязательно)")
- On submit, read UTM params from `window.location.search` (`utm_source`, `utm_medium`, `utm_campaign`) and include in POST body alongside `telegram_handle`
- Body shape: `{ email, telegram_handle?, utm_source?, utm_medium?, utm_campaign? }`

### 3. `handleSendLink` enrichment

On new user INSERT:
1. **Language detection** — parse `Accept-Language` request header, extract primary language code:
   - `ru-RU,ru;q=0.9,en-US;q=0.8` → `"ru"`
   - Fallback: `"unknown"` if header absent or unparseable
2. **Source** — compose from UTM body fields: `utm_source/utm_medium/utm_campaign`, joined as `"telegram/post/course1"` or `"direct"` if all absent
3. **Telegram handle** — sanitize: strip leading `@`, trim, max 32 chars, or `null`
4. INSERT with all four fields: `language`, `source`, `telegram_handle`, `created_at`
5. Fire-and-forget POST to `N8N_CRM_WEBHOOK_URL` with header `X-Webhook-Secret: N8N_CRM_SECRET` and body:
   ```json
   { "email": "...", "language": "ru", "source": "direct",
     "telegram_handle": null, "signed_up_at": "2026-05-13T..." }
   ```
6. Failure to reach n8n → log, do NOT block the magic link flow (user still gets email)

Returning users skip all enrichment — the `if (!user)` guard already handles this.

### 4. n8n Workflow `MDS CRM → Notion`

- **Trigger:** HTTP Webhook POST `mds-crm` (production URL)
- **Node 1 — Check Secret:** IF `x-webhook-secret` equals `N8N_CRM_SECRET` → proceed, else Respond 401
- **Node 2 — Notion Create Page:** Create page in "Точка Сборки — Students" database with properties mapped from body
- **Node 3 — Respond OK:** `{"ok":true}`

### 5. Notion Database `Точка Сборки — Students`

| Property | Type | Notes |
|---|---|---|
| Email | Title | Unique identifier |
| Language | Select | ru / en / unknown |
| Source | Text | UTM composite or "direct" |
| Telegram | Text | Handle without @ |
| Signup Date | Date | ISO from `signed_up_at` |
| Status | Select | New / Contacted / Converted (manual) |

### 6. New CF Worker Secrets

| Secret | Value |
|---|---|
| `N8N_CRM_WEBHOOK_URL` | `https://n8n.synergify.com/webhook/mds-crm` |
| `N8N_CRM_SECRET` | generated 64-char hex |

### 7. `Env` type update

Add to `workers/src/lib/types.ts`:
```typescript
N8N_CRM_WEBHOOK_URL: string
N8N_CRM_SECRET: string
```

## Error Handling

- n8n unreachable → log to console, return magic link success anyway (CRM is non-critical path)
- Notion API error inside n8n → n8n logs execution, workflow shows failed run — no retry needed for MVP
- Duplicate email on login form → user already exists → skip enrichment, skip CRM call

## Out of Scope

- Automated email sequences (manual outreach from Notion)
- Progress sync to Notion
- Deduplication if user re-registers with different browser/language

## Open Questions

_None — all resolved during design._

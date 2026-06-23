# Inline `<ModuleSurvey>` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the post-class evaluation survey inline at a module's end — module pre-filled, questions skippable — reusing the existing `/api/feedback` → n8n pipeline.

**Architecture:** Relax the worker `/api/feedback` validation to require only `lesson` (so skips are valid). Extract the shared `LikertScale`. Add a client `<ModuleSurvey module locale>` MDX component (pre-filled module, skippable Likert, localStorage "already submitted"), registered for MDX, seeded at the end of module 01's last unit.

**Tech Stack:** Cloudflare Worker (TS, Vitest) for the API; Next.js 16 (`output: 'export'`, `next-mdx-remote@6`) + React client component + Vitest for the web.

## Global Constraints

- This slice spans TWO packages. Worker commands run from `workers/` (`cd workers && npx vitest run src/handlers/feedback.test.ts`). Web commands run from `LMS/tochka-sborki/web/` (`npm test`, `npm run build`). NEVER run `npx vitest` from the repo root or the wrong package — it sweeps the wrong cwd.
- The standalone `/feedback` page must keep working unchanged (its `FeedbackForm` keeps client-side `required`).
- MDX uses only string props (`<ModuleSurvey module="01-introduction" locale="ru" />`); `next-mdx-remote@6` does not deliver array/object props.
- Bilingual: every new user-facing string has a ru + en value.
- CSS vars only; reuse the existing `feedback` dictionary labels.
- No DB migration; reuse the existing n8n delivery in `handleFeedback`.

---

### Task 1: Relax the feedback API to allow skipped questions

**Files:**
- Modify: `workers/src/handlers/feedback.ts`
- Test: `workers/src/handlers/feedback.test.ts`

**Interfaces:**
- Produces: `/api/feedback` accepts a payload with only `lesson` required; `recommend/impact/apply/unclear/other` optional. (Consumed by Task 3's `ModuleSurvey`.)

- [ ] **Step 1: Rewrite the missing-field test**

In `workers/src/handlers/feedback.test.ts`, replace the FIRST test:
```ts
  it('returns 400 if required fields missing', async () => {
    const req = new Request('https://ai.mamaev.coach/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ lesson: 'Meeting 1' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleFeedback(req, makeEnv())
    expect(res.status).toBe(400)
  })
```
with TWO tests:
```ts
  it('returns 400 if lesson is missing', async () => {
    const req = new Request('https://ai.mamaev.coach/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ recommend: '5' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleFeedback(req, makeEnv())
    expect(res.status).toBe(400)
  })

  it('forwards a lesson-only payload (Likert skipped)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 200 }))
    const req = new Request('https://ai.mamaev.coach/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ lesson: '01-introduction' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleFeedback(req, makeEnv())
    expect(res.status).toBe(200)
    expect(fetchSpy).toHaveBeenCalledOnce()
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>)['X-Webhook-Secret']).toBe('webhook_secret')
    fetchSpy.mockRestore()
  })
```

- [ ] **Step 2: Run the tests to verify the new one fails**

Run: `cd workers && npx vitest run src/handlers/feedback.test.ts`
Expected: FAIL — `forwards a lesson-only payload` gets 400 (current handler still requires recommend/impact/apply).

- [ ] **Step 3: Relax the handler**

In `workers/src/handlers/feedback.ts`, change the `FeedbackBody` interface so the Likert fields are optional:
```ts
interface FeedbackBody {
  lesson: string
  recommend?: string
  impact?: string
  apply?: string
  unclear?: string
  other?: string
}
```
And replace the validation block:
```ts
  if (!body.lesson || !body.recommend || !body.impact || !body.apply) {
    return Response.json({ error: 'Missing required fields: lesson, recommend, impact, apply' }, { status: 400 })
  }
```
with:
```ts
  if (!body.lesson) {
    return Response.json({ error: 'Missing required field: lesson' }, { status: 400 })
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd workers && npx vitest run src/handlers/feedback.test.ts`
Expected: PASS (lesson-missing → 400; lesson-only → 200 forwarded; existing full-payload + 502 tests green).

- [ ] **Step 5: Commit**

```bash
git add workers/src/handlers/feedback.ts workers/src/handlers/feedback.test.ts
git commit -m "feat(feedback): allow skipped Likert — require only lesson (fb_6a22ff6e0f0a)"
```

---

### Task 2: Extract the shared `LikertScale`

**Files:**
- Create: `LMS/tochka-sborki/web/components/likert-scale.tsx`
- Modify: `LMS/tochka-sborki/web/components/feedback-form.tsx`

**Interfaces:**
- Produces: `export function LikertScale(props: { name: string; label: string; value: string; onChange: (v: string) => void; disagree: string; agree: string; required?: boolean })` — used by `feedback-form.tsx` (Task 2) and `module-survey.tsx` (Task 3).

Pure refactor — no behavior change. Verified by the web suite + build.

- [ ] **Step 1: Create the extracted component**

Create `LMS/tochka-sborki/web/components/likert-scale.tsx`:
```tsx
'use client'

const LIKERT = ['1', '2', '3', '4', '5']

export function LikertScale({ name, label, value, onChange, disagree, agree, required = true }: {
  name: string; label: string; value: string; onChange: (v: string) => void
  disagree: string; agree: string; required?: boolean
}) {
  return (
    <fieldset style={{ border: 'none', marginBottom: '2rem' }}>
      <legend style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '1rem', lineHeight: 1.5 }}>
        {label}
      </legend>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '5rem' }}>{disagree}</span>
        {LIKERT.map(v => (
          <label key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
            <input
              type="radio" name={name} value={v} required={required}
              checked={value === v}
              onChange={() => onChange(v)}
              style={{ accentColor: 'var(--text-accent)' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v}</span>
          </label>
        ))}
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '4rem' }}>{agree}</span>
      </div>
    </fieldset>
  )
}
```

- [ ] **Step 2: Use the extracted component in `feedback-form.tsx`**

In `LMS/tochka-sborki/web/components/feedback-form.tsx`:

Add the import after the existing imports (after the `getDictionary` import line):
```tsx
import { LikertScale } from './likert-scale'
```

Delete the now-duplicated local `const LIKERT = ['1', '2', '3', '4', '5']` line AND the entire local `function LikertScale({ … }) { … }` definition (the block from `function LikertScale(` through its closing `}` before `export function FeedbackForm`). The three `<LikertScale … />` call sites in `FeedbackForm` stay exactly as they are (they omit `required`, defaulting to `true`).

- [ ] **Step 3: Run the web suite + build to verify no regression**

Run: `cd LMS/tochka-sborki/web && npm test && npm run build`
Expected: PASS — suite green; build green; `FeedbackForm` renders identically using the imported `LikertScale`.

- [ ] **Step 4: Commit**

```bash
git add LMS/tochka-sborki/web/components/likert-scale.tsx LMS/tochka-sborki/web/components/feedback-form.tsx
git commit -m "refactor(feedback): extract shared LikertScale (fb_6a22ff6e0f0a)"
```

---

### Task 3: `<ModuleSurvey>` component + dict + placement

**Files:**
- Create: `LMS/tochka-sborki/web/components/module-survey.tsx`
- Modify: `LMS/tochka-sborki/web/components/mdx-components.tsx`
- Modify: `LMS/tochka-sborki/web/lib/dictionaries.ts`
- Modify: `LMS/tochka-sborki/web/content/ru/01-introduction/u4-practice.mdx`
- Modify: `LMS/tochka-sborki/web/content/en/01-introduction/u4-practice.mdx`

**Interfaces:**
- Consumes: `LikertScale` from `@/components/likert-scale` (Task 2); the relaxed `/api/feedback` (Task 1); `getDictionary`, `type Locale` from `@/lib/dictionaries`.
- Produces: `<ModuleSurvey module="…" locale="…" />` in MDX.

Verified by a green web `npm run build` (no unit test for UI).

- [ ] **Step 1: Add the two dictionary keys**

In `LMS/tochka-sborki/web/lib/dictionaries.ts`:

(a) In the `feedback` interface block (which currently ends with `pageTitle: string` and `pageDescription: string`), add two keys after `pageDescription: string`:
```ts
    surveyHeading: string
    surveySkipHint: string
```

(b) In the `ru` locale's `feedback` object, add as the last two entries (after its `pageDescription` value):
```ts
      surveyHeading: 'Как прошёл модуль?',
      surveySkipHint: 'Любой вопрос можно пропустить — по желанию.',
```

(c) In the `en` locale's `feedback` object, add as the last two entries (after its `pageDescription` value):
```ts
      surveyHeading: 'How was this module?',
      surveySkipHint: "You can skip any question — it's optional.",
```

- [ ] **Step 2: Create the ModuleSurvey component**

Create `LMS/tochka-sborki/web/components/module-survey.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import { getDictionary, type Locale } from '@/lib/dictionaries'
import { LikertScale } from './likert-scale'

export function ModuleSurvey({ module, locale = 'ru' }: { module: string; locale?: Locale }) {
  const t = getDictionary(locale).feedback
  const key = 'module-survey:' + module
  const [mounted, setMounted] = useState(false)
  const [done, setDone] = useState(false)
  const [recommend, setRecommend] = useState('')
  const [impact, setImpact] = useState('')
  const [apply, setApply] = useState('')
  const [other, setOther] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  useEffect(() => {
    setMounted(true)
    try { if (localStorage.getItem(key)) setDone(true) } catch { /* ignore */ }
  }, [key])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson: module, recommend, impact, apply, other, locale }),
      })
      if (res.ok) {
        try { localStorage.setItem(key, '1') } catch { /* ignore */ }
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const box: React.CSSProperties = {
    margin: '2.5rem 0 1rem', padding: '1.5rem',
    background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)',
  }

  if (mounted && (done || status === 'success')) {
    return (
      <div style={{ ...box, color: 'var(--text-accent)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
        {t.successMessage}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={box}>
      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{t.surveyHeading}</div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 0, marginBottom: '1.5rem' }}>{t.surveySkipHint}</p>

      <LikertScale name="ms-recommend" label={t.recommendLabel} value={recommend} onChange={setRecommend} disagree={t.likertDisagree} agree={t.likertAgree} required={false} />
      <LikertScale name="ms-impact" label={t.impactLabel} value={impact} onChange={setImpact} disagree={t.likertDisagree} agree={t.likertAgree} required={false} />
      <LikertScale name="ms-apply" label={t.applyLabel} value={apply} onChange={setApply} disagree={t.likertDisagree} agree={t.likertAgree} required={false} />

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>{t.otherLabel}</label>
        <textarea
          value={other}
          onChange={e => setOther(e.target.value)}
          rows={3}
          style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box' }}
        />
      </div>

      {status === 'error' && (
        <p style={{ color: 'var(--crit)', marginBottom: '1rem', fontSize: '0.875rem' }}>{t.errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        style={{ padding: '0.75rem 1.75rem', background: 'var(--text-accent)', color: 'var(--text-on-accent)', fontWeight: 900, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', borderRadius: 'var(--radius)', border: 'none', cursor: status === 'loading' ? 'wait' : 'pointer' }}
      >
        {status === 'loading' ? t.submitting : t.submit}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Register the component in MDX**

In `LMS/tochka-sborki/web/components/mdx-components.tsx`:

Add the import after the `WillWont` import line:
```tsx
import { ModuleSurvey } from './module-survey'
```
Add `ModuleSurvey,` to the `mdxComponents` object after the `WillWont,` entry:
```tsx
  WillWont,
  ModuleSurvey,
}
```

- [ ] **Step 4: Insert into the RU module-01 last unit**

In `LMS/tochka-sborki/web/content/ru/01-introduction/u4-practice.mdx`, find:
```
Это твой персональный план внутри курса.

</Phase>
```
Replace it with:
```
Это твой персональный план внутри курса.

</Phase>

<ModuleSurvey module="01-introduction" locale="ru" />
```

- [ ] **Step 5: Insert into the EN module-01 last unit**

In `LMS/tochka-sborki/web/content/en/01-introduction/u4-practice.mdx`, find:
```
This is your personal plan inside the course.

</Phase>
```
Replace it with:
```
This is your personal plan inside the course.

</Phase>

<ModuleSurvey module="01-introduction" locale="en" />
```

- [ ] **Step 6: Verify the build compiles**

Run: `cd LMS/tochka-sborki/web && npm run build`
Expected: PASS — build completes; both `<ModuleSurvey>` usages render; the survey block appears at the end of module 01's last unit.

- [ ] **Step 7: Commit**

```bash
git add LMS/tochka-sborki/web/components/module-survey.tsx LMS/tochka-sborki/web/components/mdx-components.tsx LMS/tochka-sborki/web/lib/dictionaries.ts LMS/tochka-sborki/web/content/ru/01-introduction/u4-practice.mdx LMS/tochka-sborki/web/content/en/01-introduction/u4-practice.mdx
git commit -m "feat(feedback): inline ModuleSurvey at module end + course-01 placement (fb_6a22ff6e0f0a)"
```

---

## Self-Review

**1. Spec coverage:**
- Backend relax to `lesson`-only (skippable) + test rewrite → Task 1. ✓
- Extract shared `LikertScale` with `required?` → Task 2. ✓
- `ModuleSurvey` (pre-filled module, skippable Likert `required={false}`, open field, POST /api/feedback, localStorage "already submitted", success/error states) → Task 3 step 2. ✓
- Dict keys `surveyHeading`/`surveySkipHint` ru+en → Task 3 step 1. ✓
- Registration → Task 3 step 3. ✓
- 2 MDX placements (ru/en 01 u4-practice end) → Task 3 steps 4-5. ✓
- String props only; standalone `/feedback` unaffected → Global Constraints + Task 2 keeps default `required=true`. ✓
- Bilingual, static-export-safe (`mounted` guard), no migration → Task 3 component + Global Constraints. ✓
- Out of scope (auto-inject, new DB, FeedbackForm UX) → not built. ✓

**2. Placeholder scan:** No TBD/TODO; complete code in every step; exact MDX/dict anchors; full bilingual values. ✓

**3. Type consistency:** `LikertScale` signature (`required?: boolean`) defined in Task 2 and consumed in Task 2 (`feedback-form`, omitting → true) and Task 3 (`required={false}`). `ModuleSurvey` POSTs `{ lesson: module, recommend, impact, apply, other, locale }` — matches the relaxed `FeedbackBody` (Task 1: only `lesson` required). Dict keys `surveyHeading`/`surveySkipHint` added in the interface (Task 3 step 1a) and read as `t.surveyHeading`/`t.surveySkipHint` in the component (step 2). `<ModuleSurvey>` registered under the same name used in MDX. ✓

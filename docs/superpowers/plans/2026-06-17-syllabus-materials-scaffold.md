# Syllabus + Materials Scaffold Plan (fb_f4e32117942e)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** `/syllabus` (RU+EN) с деревом модуль→юнит + Course Materials манифест + `lib/course.ts` config (scaffold для будущих курсов).

**Architecture:** `lib/course.ts` (central config) + `lib/materials.ts` (declarative manifest) + generic `SyllabusTree`/`MaterialsSection` + server pages + nav tab. Домен в SEO/manifest → `COURSE.domain`.

**Tech Stack:** Next 16 static export, vitest env=node, server components.

**Spec:** `docs/superpowers/specs/2026-06-17-syllabus-materials-scaffold-design.md`

---

### Task 1: `lib/course.ts` config (TDD)
**Files:** Create `lib/course.ts` + `lib/course.test.ts`
- [ ] Failing: COURSE.domain matches `^https://`; locales include ru&en; name truthy; export `Bi` type.
- [ ] `vitest run lib/course.test.ts` → FAIL; implement; → PASS.

### Task 2: rewire domain to COURSE.domain
**Files:** Modify `app/sitemap.ts`, `app/robots.ts`, `app/layout.tsx`
- [ ] Replace literal `'https://ai.mamaev.coach'` with `COURSE.domain` in all three. `vitest run` + `tsc` stay green.

### Task 3: `lib/materials.ts` manifest (TDD)
**Files:** Create `lib/materials.ts` + `lib/materials.test.ts`
- [ ] Failing: manifest non-empty; each group has label.ru/en + ≥1 item; each item href + title.ru/en; `isExternalHref('https://x')` true, `('/x')` false; tool items external.
- [ ] FAIL → implement (3 groups per spec) → PASS.

### Task 4: copy template materials to public/
**Files:** Create `public/materials/agent-charter.md`, `public/materials/automation-recipes.md`
- [ ] Copy from `../../my-templates/`. Verify non-empty.

### Task 5: generic components
**Files:** Create `components/syllabus-tree.tsx`, `components/materials-section.tsx`
- [ ] `SyllabusTree({modules, locale})`: module→unit tree, unit links to `/lessons/<slug>/<unit>/` (+/en).
- [ ] `MaterialsSection({groups, locale})`: render groups; kind icon; external/download attrs.

### Task 6: pages + nav + i18n
**Files:** Create `app/syllabus/page.tsx`, `app/en/syllabus/page.tsx`; Modify `lib/dictionaries.ts`, `components/nav.tsx`
- [ ] Pages: getAllModules(locale) → Nav + SyllabusTree + MaterialsSection + metadata.
- [ ] dictionaries `nav.syllabus` (interface + ru 'Программа' + en 'Syllabus').
- [ ] nav.tsx: public syllabus link near roadmap.

### Task 7: gates + ship
- [ ] `vitest run`; web tsc; workers tsc; wrangler dry-run; `next build` → assert `out/syllabus/index.html`, `out/en/syllabus/index.html`, `out/materials/agent-charter.md`.
- [ ] Commit (branch→ff-merge→push); `fb status fb_f4e32117942e done` + build; memory write-back.

## Self-review
- Spec coverage: course.ts ✓(T1-2), materials ✓(T3-4), syllabus tree ✓(T5-6), nav ✓(T6), tests ✓.
- Type consistency: `Bi` from course.ts reused by materials.ts; `ModuleMeta` from content.ts.
- Gotcha 2: new files in app/lib/components — NOT consumed by workers; confirm via workers tsc T7.
- YAGNI: no CMS, no full data extraction (follow-up tickets filed).

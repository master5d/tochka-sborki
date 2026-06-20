# RPG ↔ Plain-mode Toggle — Design Spec

**Date:** 2026-06-20
**Batch:** 1b (clarity / positioning)
**Closes:** `fb_c4366260db34` (RPG plain-mode + skill-gating clarity). The "это метафора, не
игра" frame already shipped in 1a (intake clarity-gate).

## Problem

A non-gamer fled the RPG jargon ("Квест-лог / шарды / кадет / Лист персонажа") and misread the
character-sheet attributes as skill-gating ("модули зависят от скиллов — каких? я не программист").
Modules are NOT gated — the landing says "выбирай в любом порядке"; the attributes are flavor.

## Findings (scope reality)

- **Units are already plain by default** — `getUnitFraming(pack,…)` is null-safe; skin flavor is
  additive. No unit work.
- **Deep dungeon/daily/world-map titles are skin-GENERATED flavor** (a different mechanism), not
  static labels. Out of scope for v1 (optional follow-on: suppress skin pack in plain mode).
- **Static persistent chrome** is the real always-on jargon a non-gamer keeps hitting:
  `nav.questLog`, the character-sheet ("Квест-лог" CTA, "Лист персонажа"), the CS currency word
  ("шарды") in the Vault.

## Approach (owner-selected: A — bounded toggle)

A binary `rpg-mode` preference with a nav pill, mirroring `os-pref.ts` / the OS toggle. A pure,
tested override map swaps a curated set of static chrome labels to plain when mode = plain. Plus a
**skill-gating reassurance** line on the character sheet, shown in BOTH modes (universally clarifying).

## Components

- `lib/rpg-mode.ts` (pure, engine): `RpgMode = 'rpg' | 'plain'`, `RPG_MODE_KEY = 'rpg-mode'`,
  default `'rpg'`. `readStoredRpgMode / storeRpgMode / effectiveRpgMode`. `PLAIN_OVERRIDES:
  Record<Locale, Record<OverrideKey, string>>`. `plainLabel(mode, locale, key, fallback)` → override
  in plain, else fallback. `SKILL_GATING_NOTE: Record<Locale, string>`.
- `lib/use-rpg-mode.ts` (client hook): mounted-guard (like ThemeToggle); returns
  `{ mode, ready, plain(key, fallback) }`.
- `components/rpg-mode-toggle.tsx`: nav pill 🎲 RPG ⇄ 📄 Plain; `storeRpgMode` + `location.reload()`.
- Wire into: `components/nav.tsx` (toggle + `questLog`), `components/character-sheet.tsx`
  ("Квест-лог" CTA + "Лист персонажа" + always-on skill-gating note), `components/cs/vault.tsx`
  (currency word "шарды" → "очки").

## Override keys + plain copy

| key | RPG (fallback) | plain ru | plain en |
|---|---|---|---|
| `navQuestLog` | ⬡ Квест-лог | Мои уроки | My lessons |
| `enterQuestLog` | Войти в Квест-лог → | Открыть мои уроки → | Open my lessons → |
| `sheetName` | Лист персонажа | профиль ученика | student profile |
| `currency` | шарды | очки | points |

**Skill-gating note (both modes), on character sheet under attributes:**
- ru: `Это игровой штрих. «Характеристики» ничего не блокируют — модули проходятся в любом
  порядке, и программировать не нужно.`
- en: `This is a playful touch. These "stats" don't lock anything — take modules in any order,
  no programming required.`

## Testing

vitest (env=node) on the pure core: `plainLabel` returns override in plain / fallback in rpg for
both locales; every `OverrideKey` exists in both locales; `effectiveRpgMode` defaults to `'rpg'`.

## Out of scope (optional follow-on)

Suppressing skin-generated flavor (dungeon zones, daily quest titles, world-map names) in plain
mode — would treat the skin pack as neutral; bigger behavioral change, deferred.

---
name: tochka-sborki-update
type: workflow
execution: stateless
description: >
  Update, edit, and extend the Точка Сборки course project — add new Meetings, insert sections into existing lessons,
  fix formatting, and automatically cascade changes to INDEX.md, README.md, CHEATSHEET.md, and version metadata.
  Use this skill whenever the user wants to add content to Точка Сборки, create a new Meeting, update course structure,
  fix a lesson, add exercises, update the cheatsheet, or make any modification to the course files.
  Also trigger when the user mentions "добавь в курс", "новый Meeting", "обнови индекс", "поправь урок",
  "добавь секцию", "обнови шпаргалку", or references any XX-topic.md file in the Точка Сборки project.
---

# Точка Сборки Course Updater

You are updating an interactive Russian-language course on Claude Code and agent-based programming.
The course lives in a flat Markdown structure with strict naming and style conventions.
Your job is to make changes cleanly and then cascade updates to all dependent files so nothing gets out of sync.

## Project Map

```
Точка Сборки/
├── XX-topic.md          ← Lesson files (01-introduction.md, 02-setup-guide.md, ...)
├── INDEX.md             ← Full course navigator (structure, checkpoints, stats, FAQ)
├── README.md            ← Course overview, structure list, learning path, version
├── CHEATSHEET.md        ← Quick-reference commands and patterns
├── EXERCISES.md         ← 8 practical exercises
├── PERSONAL-CONTEXT.md  ← Student profile template
├── CLAUDE.md            ← Project context for Claude Code
├── my-experiments/      ← Student work outputs
└── my-templates/        ← Prompt templates
```

## Style Conventions

These conventions keep the course consistent. Follow them for all content you write or modify.

- **Language**: Russian primary, English for technical terms and code
- **Headings**: Use emoji prefixes for top-level sections (e.g., `## 🎯 Цели`, `## 🔄 Алгоритм`)
- **Tips**: Use blockquote format `> 💡 Совет текст`
- **Checklists**: Use `- [ ]` for actionable items
- **Tables**: Use Markdown tables for comparisons and reference data
- **Code blocks**: Always specify language (```bash, ```markdown, ```json)
- **File naming**: `XX-topic.md` where XX is zero-padded number (01, 02, ... 09, 10)
- **Section separators**: Use `---` between major sections

## Operations

### 1. Add a New Meeting

When the user asks to add a new Meeting (lesson), follow this sequence:

**Step 1 — Determine the next number.**
Read the existing lesson files to find the highest XX number. The new file is `{XX+1}-topic.md`.

**Step 2 — Create the lesson file.**
Use this skeleton (adapt content to the topic):

```markdown
# Meeting {N}: {Title}

## 🎯 Цели встречи
- Цель 1
- Цель 2

## 📋 Предварительные требования
- Пройти Meeting {N-1}
- [Other prerequisites]

---

## {Main content sections with emoji headings}

---

## 🏋️ Практика
[Exercises specific to this meeting]

---

## ✅ Чеклист
- [ ] Item 1
- [ ] Item 2

---

**Время:** X-Y часов
```

**Step 3 — Cascade updates.** This is the critical part. Update all of these files:

#### README.md
- Add the new Meeting to `## 📚 Структура курса` (follow existing pattern: `### [Meeting N: Title](./XX-topic.md)` + one-line description)
- Add a new Day to `## 📋 Рекомендуемый путь обучения` with checklist items
- Bump the version number (increment minor: 1.1 → 1.2)
- Update the date to today

#### INDEX.md
- Add to `## 🎯 Начни здесь` numbered list
- Add a new `#### Meeting N:` block under `### 🎓 Основной курс` with bullet points describing what the student will learn, estimated time, and homework/result
- Update the file tree in `## 📁 Папки и файлы`
- Add a new Day to `## 🚀 Рекомендованный путь обучения`
- Add a `### ✅ После Meeting N` checkpoint
- Update `## 📊 Статистика курса` (meeting count, hours)
- Add to the `## 📞 Быстрая справка` table
- Update the date and version at the bottom

#### CHEATSHEET.md (if the meeting introduces new commands or patterns)
- Add relevant quick-reference entries

#### CLAUDE.md
- Update the structure listing if needed
- Keep it under 200 lines

### 2. Add a Section to an Existing Meeting

When the user wants to insert content into an existing lesson:

**Step 1 — Read the target file** to understand its structure and find the right insertion point.

**Step 2 — Write the new section** following the style conventions. Match the heading level and formatting of surrounding content.

**Step 3 — Check if cascade updates are needed.** A new section usually does NOT require INDEX.md/README.md changes unless it adds a major new topic that should appear in the navigator. Use judgment — if the section adds a significant new capability or concept, update the INDEX.md bullet points for that meeting.

### 3. Fix Formatting or Content Errors

When the user reports a rendering issue, broken link, or content error:

**Step 1 — Read the file** and identify the problem.

**Step 2 — Fix it** using minimal edits. Common issues:
- Nested code blocks breaking markdown rendering (remove inner language markers)
- Missing `---` separators
- Broken relative links (should be `./filename.md`)
- Inconsistent heading levels

**Step 3 — Verify** by checking that the fix doesn't break surrounding content.

### 4. Update Reference Files

When the user asks to update CHEATSHEET.md, EXERCISES.md, or other reference files:

- Follow the existing structure and formatting of the target file
- Keep CHEATSHEET.md practical — commands and patterns, not theory
- Keep EXERCISES.md actionable — clear instructions, expected time, success criteria

### 5. Add Student Resources

When adding templates, examples, or experiment files:

- Templates go to `my-templates/`
- Student work outputs go to `my-experiments/`
- Each file should have a clear header explaining its purpose

## Cascade Checklist

After ANY structural change (new meeting, renamed file, reorganized content), verify:

- [ ] README.md `## 📚 Структура курса` is up to date
- [ ] README.md `## 📋 Рекомендуемый путь обучения` matches actual meetings
- [ ] README.md version and date are bumped
- [ ] INDEX.md `## 🎯 Начни здесь` list matches actual files
- [ ] INDEX.md `### 🎓 Основной курс` has entry for every meeting
- [ ] INDEX.md file tree matches actual structure
- [ ] INDEX.md checkpoints exist for every meeting
- [ ] INDEX.md stats are accurate
- [ ] CLAUDE.md structure listing is current

## Important Notes

- Never delete content without explicit user confirmation
- When in doubt about placement, ask the user before inserting
- Maintain the haiku in README.md — it's intentional
- The course version follows semver-like pattern: major.minor (bump minor for new meetings, major for restructuring)
- Dates use format YYYY-MM-DD
- Keep CLAUDE.md under 200 lines — it's loaded into every Claude Code session

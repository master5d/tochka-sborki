# LMS/_template/ authoring scaffold

**Тикет:** `fb_31371f4dfd19` (idea, area lms) — boilerplate для нового курса.
**Дата:** 2026-06-17
**Решение пользователя:** лёгкий authoring-scaffold (НЕ полная копия движка — движок ещё сплавлен с данными, извлечение = `fb_8f1a05ce1150`; копировать сейчас = throwaway-дубликат).

## Назначение
Дать автору нового курса **контракт + стабы + content-скелет + чек-лист**: что именно надо заполнить, чтобы движок LMS (`LMS/<course>/web/`) поднял новый курс. Без дублирования engine — это документация-как-код, переживающая будущее извлечение shared-engine.

## Файлы (`LMS/_template/`)
1. **`README.md`** — гайд: что такое engine vs course-data; как стартовать новый курс (пока: скопировать `tochka-sborki/web/`, заменить данные по чек-листу; после `fb_8f1a05ce1150` — тонкий data-пакет). Ссылки на якоря движка.
2. **`CHECKLIST.md`** — контракт «что предоставляет курс» (из аудита): `lib/course.ts`, `lib/dictionaries.ts` значения (32 потребителя), `lib/materials.ts`, `lib/rpg/skins/*` + `skins-meta`, `lib/rpg/niche-map.ts`, `lib/showcase.ts`, `content/{ru,en}/<NN-module>/` (модули+юниты). Помечено, что generic (переиспользуется) vs course-specific (заполнить).
3. **`course.config.template.ts`** — стаб `COURSE` (зеркало `lib/course.ts`) с TODO-плейсхолдерами.
4. **`materials.template.ts`** — стаб `COURSE_MATERIALS` (одна пустая группа-пример).
5. **`content/{ru,en}/01-example/`** — пример модуля: `_meta.json` (точная форма: module/title/description/duration/level/units) + `u1-intro.mdx` (frontmatter title/unit/module/duration + `<Phase>` пример).

## Вне scope
- Исполняемый код/тесты (это стабы `.template.ts` + markdown, не импортятся движком, tsc их не трогает — `_template/` вне `web/`).
- Полная копия web-аппа (вариант отклонён пользователем).
- Реальное извлечение engine (`fb_8f1a05ce1150`).
- CLI-генератор нового курса (позже, после shared-engine).

## Критерий готовности
`LMS/_template/` содержит README + CHECKLIST + 2 `.template.ts` стаба + bilingual content-пример (`_meta.json` + `.mdx`). Автор по чек-листу видит полный список course-specific точек. Стабы синтаксически валидны и отражают актуальные интерфейсы `course.ts`/`materials.ts`.

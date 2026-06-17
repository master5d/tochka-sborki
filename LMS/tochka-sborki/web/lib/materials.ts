// web/lib/materials.ts
// Declarative Course Materials manifest. The engine renders any course's materials from this
// data (MaterialsSection); a future course swaps the manifest, not the component. Scaffold.
import type { Bi } from './course'

export type MaterialKind = 'template' | 'link' | 'tool'

export interface Material {
  kind: MaterialKind
  title: Bi
  description?: Bi
  href: string
  /** True for off-site links (open in a new tab). Keep in sync with the href. */
  external?: boolean
}

export interface MaterialGroup {
  label: Bi
  items: Material[]
}

/** http(s):// → external; anything else (relative path) is internal. */
export function isExternalHref(href: string): boolean {
  return /^https?:\/\//.test(href)
}

export const COURSE_MATERIALS: MaterialGroup[] = [
  {
    label: { ru: 'Шаблоны', en: 'Templates' },
    items: [
      {
        kind: 'template',
        title: { ru: 'Устав агента', en: 'Agent Charter' },
        description: { ru: 'Заготовка system-промпта для твоего ИИ-напарника', en: 'A system-prompt starter for your AI partner' },
        href: '/materials/agent-charter.md',
      },
      {
        kind: 'template',
        title: { ru: 'Рецепты автоматизации', en: 'Automation Recipes' },
        description: { ru: 'Готовые паттерны агентных автоматизаций', en: 'Ready-made agentic automation patterns' },
        href: '/materials/automation-recipes.md',
      },
    ],
  },
  {
    label: { ru: 'Из курса', en: 'From the course' },
    items: [
      { kind: 'link', title: { ru: 'Шпаргалка', en: 'Cheatsheet' }, href: '/cheatsheet/' },
      { kind: 'link', title: { ru: 'Roadmap', en: 'Roadmap' }, href: '/roadmap/' },
      { kind: 'link', title: { ru: 'Установка стека (macOS/Linux)', en: 'Install the stack (macOS/Linux)' }, href: '/install.sh' },
      { kind: 'link', title: { ru: 'Установка стека (Windows)', en: 'Install the stack (Windows)' }, href: '/install.ps1' },
      { kind: 'link', title: { ru: 'Установка за GFW (cloud-relay)', en: 'Install behind GFW (cloud relay)' }, href: '/install-gfw.sh' },
    ],
  },
  {
    label: { ru: 'Инструменты стека', en: 'Stack tools' },
    items: [
      { kind: 'tool', title: { ru: 'Claude Code', en: 'Claude Code' }, href: 'https://claude.com/claude-code', external: true },
      { kind: 'tool', title: { ru: 'OpenAI Codex', en: 'OpenAI Codex' }, href: 'https://openai.com/codex/', external: true },
      { kind: 'tool', title: { ru: 'OpenRouter', en: 'OpenRouter' }, href: 'https://openrouter.ai', external: true },
      { kind: 'tool', title: { ru: 'LiteLLM', en: 'LiteLLM' }, href: 'https://litellm.ai', external: true },
    ],
  },
]

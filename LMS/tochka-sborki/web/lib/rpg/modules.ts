// Canonical module slugs in ascending order (mirrors content/<locale>/NN-* dirs).
export const MODULE_SLUGS = [
  '00-kickstart', '01-introduction', '02-setup-guide', '03-stack-selection',
  '04-prompt-engineering', '05-context-memory', '06-audio-pipeline', '07-tools', '08-agent-engineering',
] as const
export type ModuleSlug = (typeof MODULE_SLUGS)[number]

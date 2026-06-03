// hub/lib/ai-prompt.ts
// Shared prompt builders for «Прочитать с ИИ» (whole-article + selected fragment)
// and the agent deep-link URLs. Pure — reused by the end block, the floating dock,
// and the selection affordance.

export const MAX_SELECTION = 600

/** Prompt for handing the whole article to an agent. */
export function fullArticlePrompt(url: string, title: string): string {
  return (
    `Прочитай статью: ${url} («${title}»). Разбери её, вытащи ключевые принципы и ` +
    `помоги применить их к моей задаче. Сначала спроси, над чем я сейчас работаю.`
  )
}

/** Prompt for a selected fragment: whitespace-collapsed, capped, context link attached. */
export function fragmentPrompt(url: string, selection: string): string {
  const clean = selection.trim().replace(/\s+/g, ' ')
  const truncated = clean.length > MAX_SELECTION
  const frag = truncated ? clean.slice(0, MAX_SELECTION).trimEnd() + '…' : clean
  const note = truncated ? ' (фрагмент)' : ''
  return (
    `Вот фрагмент из статьи ${url}${note}: «${frag}». Разбери его и помоги применить ` +
    `к моей задаче. Полный контекст — по ссылке.`
  )
}

/** Deep-link that opens the agent with the prompt prefilled. */
export function agentUrl(agent: 'chatgpt' | 'claude', prompt: string): string {
  const q = encodeURIComponent(prompt)
  return agent === 'chatgpt' ? `https://chatgpt.com/?q=${q}` : `https://claude.ai/new?q=${q}`
}

import type { Env } from '../lib/types'
import { parseUpdate } from '../lib/telegram-update'
import { nextLesson, lessonUrl, homeUrl } from '../lib/course-order'
import { botCopy, pickLocale, type BotLocale } from '../lib/bot-copy'
import { sendMessage } from '../lib/telegram-api'

async function loadProgress(env: Env, userId: string): Promise<{ completed: Set<string>; viewed: Set<string> }> {
  const { results } = await env.DB.prepare(
    'SELECT lesson_slug, completed_at FROM progress WHERE user_id = ?'
  ).bind(userId).all<{ lesson_slug: string; completed_at: number | null }>()
  const completed = new Set<string>()
  const viewed = new Set<string>()
  for (const r of results ?? []) {
    viewed.add(r.lesson_slug)
    if (r.completed_at) completed.add(r.lesson_slug)
  }
  return { completed, viewed }
}

export async function handleTelegramWebhook(request: Request, env: Env): Promise<Response> {
  // authenticate: Telegram echoes the secret_token set at setWebhook time
  const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
  if (!env.TELEGRAM_WEBHOOK_SECRET || secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response('Forbidden', { status: 403 })
  }

  let update: unknown
  try { update = await request.json() } catch { return new Response('ok', { status: 200 }) }

  try {
    const intent = parseUpdate(update)
    if (intent.chatId == null) return new Response('ok', { status: 200 })

    let locale: BotLocale = pickLocale(intent.languageCode)
    let user: { id: string; language: string | null } | null = null
    if (intent.fromId) {
      user = await env.DB.prepare('SELECT id, language FROM users WHERE telegram_id = ?')
        .bind(intent.fromId).first<{ id: string; language: string | null }>()
      if (user?.language) locale = pickLocale(user.language)
    }
    const copy = botCopy(locale)

    if (intent.kind === 'start') {
      await sendMessage(env, intent.chatId, copy.greeting, { text: copy.openCourse, url: homeUrl(locale) })
    } else if (intent.kind === 'continue') {
      if (!user) {
        await sendMessage(env, intent.chatId, copy.openFirst, { text: copy.openCourse, url: homeUrl(locale) })
      } else {
        const { completed, viewed } = await loadProgress(env, user.id)
        const next = nextLesson(completed, viewed)
        if (!next) {
          await sendMessage(env, intent.chatId, copy.finished)
        } else {
          await sendMessage(env, intent.chatId, copy.continueIntro, { text: copy.continueLabel, url: lessonUrl(next.slug, locale) })
        }
      }
    } else {
      await sendMessage(env, intent.chatId, copy.hint, { text: copy.openCourse, url: homeUrl(locale) })
    }

    return new Response('ok', { status: 200 })
  } catch (e) {
    console.error('telegram webhook error', e)
    return new Response('ok', { status: 200 })
  }
}

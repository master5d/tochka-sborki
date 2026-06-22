import type { Env } from './types'

export interface WebAppButton { text: string; url: string }

// Minimal raw Bot API sendMessage. Optional single web_app inline button.
export async function sendMessage(env: Env, chatId: number, text: string, button?: WebAppButton): Promise<void> {
  const reply_markup = button
    ? { inline_keyboard: [[{ text: button.text, web_app: { url: button.url } }]] }
    : undefined
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup }),
  })
}

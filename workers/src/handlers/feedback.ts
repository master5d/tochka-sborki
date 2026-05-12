import type { Env } from '../lib/types'

interface FeedbackBody {
  lesson: string
  recommend: string
  impact: string
  apply: string
  unclear?: string
  other?: string
}

export async function handleFeedback(request: Request, env: Env): Promise<Response> {
  let body: FeedbackBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.lesson || !body.recommend || !body.impact || !body.apply) {
    return Response.json({ error: 'Missing required fields: lesson, recommend, impact, apply' }, { status: 400 })
  }

  let n8nRes: Response
  try {
    n8nRes = await fetch(env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': env.N8N_WEBHOOK_SECRET,
      },
      body: JSON.stringify({ ...body, submitted_at: new Date().toISOString() }),
    })
  } catch {
    return Response.json({ error: 'Failed to deliver feedback' }, { status: 502 })
  }

  if (!n8nRes.ok) {
    return Response.json({ error: 'Failed to deliver feedback' }, { status: 502 })
  }

  return Response.json({ ok: true })
}

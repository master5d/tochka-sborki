import type { Env } from './lib/types'
import { handleFeedback } from './handlers/feedback'
import { handleSendLink, handleVerify, handleMe, handleLogout } from './handlers/auth'
import { handleView, handleComplete, handleList } from './handlers/progress'

const ALLOWED_ORIGINS = [
  'https://ai.mamaev.coach',
  'https://mamaev.coach',
  'https://mentor.mamaev.coach'
]

function getCorsHeaders(request: Request) {
  const origin = request.headers.get('Origin')
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin || '') ? origin! : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = getCorsHeaders(request)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    try {
      const url = new URL(request.url)
      const path = url.pathname
      const method = request.method

      let response: Response

      if (path === '/api/feedback' && method === 'POST') {
        response = await handleFeedback(request, env)
      } else if (path === '/api/auth/send-link' && method === 'POST') {
        response = await handleSendLink(request, env)
      } else if (path === '/api/auth/verify' && method === 'POST') {
        response = await handleVerify(request, env)
      } else if (path === '/api/auth/me' && method === 'GET') {
        response = await handleMe(request, env)
      } else if (path === '/api/auth/logout' && method === 'POST') {
        response = await handleLogout(request, env)
      } else if (path === '/api/progress/view' && method === 'POST') {
        response = await handleView(request, env)
      } else if (path === '/api/progress/complete' && method === 'POST') {
        response = await handleComplete(request, env)
      } else if (path === '/api/progress/list' && method === 'GET') {
        response = await handleList(request, env)
      } else {
        response = new Response('Not Found', { status: 404 })
      }

      const newHeaders = new Headers(response.headers)
      Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v))
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders })
    } catch (e) {
      console.error('Worker error:', e)
      return new Response(JSON.stringify({ error: 'Internal Server Error', message: e instanceof Error ? e.message : String(e) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }
  },
}

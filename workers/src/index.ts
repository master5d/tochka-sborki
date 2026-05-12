import type { Env } from './lib/types'
import { handleFeedback } from './handlers/feedback'
import { handleSendLink, handleVerify, handleMe, handleLogout } from './handlers/auth'
import { handleView, handleComplete, handleList } from './handlers/progress'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://mamaev.coach',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

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
    Object.entries(CORS_HEADERS).forEach(([k, v]) => newHeaders.set(k, v))
    return new Response(response.body, { status: response.status, headers: newHeaders })
  },
}

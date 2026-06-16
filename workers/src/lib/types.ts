export interface Env {
  DB: D1Database
  WORKER_JWT_SECRET: string
  RESEND_API_KEY: string
  N8N_WEBHOOK_URL: string
  N8N_WEBHOOK_SECRET: string
  RESEND_AUDIENCE_ID: string
  GEMINI_API_KEY: string
  OWNER_EMAIL: string
}

export interface JWTPayload {
  sub: string    // user_id
  email: string
  iat: number
  exp: number
}

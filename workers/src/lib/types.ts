export interface Env {
  DB: D1Database
  WORKER_JWT_SECRET: string
  RESEND_API_KEY: string
  N8N_WEBHOOK_URL: string
  N8N_WEBHOOK_SECRET: string
  GEMINI_API_KEY: string
  OWNER_EMAIL: string
  TELEGRAM_BOT_TOKEN: string
  TELEGRAM_WEBHOOK_SECRET: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
}

export interface JWTPayload {
  sub: string    // user_id
  email: string
  iat: number
  exp: number
}

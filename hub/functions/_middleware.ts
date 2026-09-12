// Cloudflare Pages Function: picks the home-page cover on the backend.
// Runs only for `/` and `/en/` (public/_routes.json); logic lives in
// lib/cover-middleware.ts so it can be tested without the Pages runtime.
import { handleCover, type CoverEnv } from '../lib/cover-middleware'

export const onRequest = (ctx: { request: Request; env: CoverEnv; next: () => Promise<Response> }) =>
  handleCover(ctx.request, ctx.env, ctx.next)

import type { NextConfig } from 'next'

// assetPrefix '/blog' namespaces this app's /_next assets under /blog/_next so
// they never collide with hub's /_next when both exports are merged (model B).
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  assetPrefix: '/blog',
  images: { unoptimized: true },
}

export default config

import path from 'node:path'
import type { NextConfig } from 'next'

const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // Monorepo root, so Turbopack compiles the vendored @desops/ui-kit source
  // (vendor/ sits beside hub/) both locally and in CI.
  turbopack: { root: path.join(__dirname, '..') },
}

export default config

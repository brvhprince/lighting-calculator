const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a minimal standalone server bundle for small, fast Docker images.
  output: 'standalone',
  // Pin the trace root to this project so the standalone bundle is built from
  // the right directory (several package-lock.json files exist further up).
  outputFileTracingRoot: path.join(__dirname),
}

module.exports = nextConfig

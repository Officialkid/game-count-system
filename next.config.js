/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize Fast Refresh
  experimental: {
    optimizePackageImports: ['lucide-react', '@/components', '@/lib'],
  },
  // Reduce compilation time
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
  // Enable SWC minification for faster builds
  swcMinify: true,
}

module.exports = nextConfig

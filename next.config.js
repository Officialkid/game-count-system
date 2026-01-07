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
    
    // Ensure @/ alias resolves correctly in production (Render)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
    }
    
    // Ensure index files are resolved
    config.resolve.extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', ...config.resolve.extensions]
    
    return config
  },
  // Enable SWC minification for faster builds
  swcMinify: true,
}

module.exports = nextConfig

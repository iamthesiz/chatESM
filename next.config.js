/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development'

console.log('Next.js config - NODE_ENV:', process.env.NODE_ENV, 'isDev:', isDev)

// Use Babel in development for better DevTools experience
// Use SWC in production for faster builds
const nextConfig = isDev ? {
  // Development config - uses Babel for proper Emotion labels
  reactStrictMode: false,
  transpilePackages: ['molstar', 'react-icons'],
  webpack: (config, { dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'molstar': 'molstar/lib',
    }
    // Force webpack to show we're in dev mode
    if (dev) {
      console.log('Webpack running in development mode with Babel')
    }
    return config
  },
} : {
  // Production config - uses SWC for performance
  reactStrictMode: true,
  compiler: {
    emotion: {
      sourceMap: false,
      autoLabel: 'never',
    },
  },
  transpilePackages: ['molstar'],
  webpack: (config, { dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'molstar': 'molstar/lib',
    }
    // Force webpack to show we're in dev mode
    if (dev) {
      console.log('Webpack running in development mode with Babel')
    }
    return config
  },
}

module.exports = nextConfig

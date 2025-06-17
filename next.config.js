/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    emotion: true,
  },
  transpilePackages: ['molstar'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'molstar': 'molstar/lib',
    }
    return config
  },
}

module.exports = nextConfig
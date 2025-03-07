/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['ipfs.io'],
    unoptimized: true,
  },
  // Important for Netlify deployment
  target: 'serverless',
  // Ensure trailing slashes are handled correctly
  trailingSlash: true,
  // Disable source maps in production for better performance
  productionBrowserSourceMaps: false,
  // Optimize for Netlify's environment
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig

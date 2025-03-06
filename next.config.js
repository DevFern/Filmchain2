/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true, // Required for static export
    domains: [
      'ipfs.io',
      'ipfs.infura.io',
      'gateway.pinata.cloud'
    ]
  },
  // Ensure trailing slashes for IPFS compatibility
  trailingSlash: true,
  // Disable image optimization for static export
  webpack: (config) => {
    // IPFS-specific configurations
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  // Environment variables that will be available at build time
  env: {
    NEXT_PUBLIC_FILM_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_FILM_TOKEN_ADDRESS,
    NEXT_PUBLIC_NFT_MARKET_ADDRESS: process.env.NEXT_PUBLIC_NFT_MARKET_ADDRESS,
    NEXT_PUBLIC_FILM_NFT_ADDRESS: process.env.NEXT_PUBLIC_FILM_NFT_ADDRESS,
    NEXT_PUBLIC_COMMUNITY_VOICE_ADDRESS: process.env.NEXT_PUBLIC_COMMUNITY_VOICE_ADDRESS,
    NEXT_PUBLIC_INDIE_FUND_ADDRESS: process.env.NEXT_PUBLIC_INDIE_FUND_ADDRESS,
    NEXT_PUBLIC_BLOCK_OFFICE_ADDRESS: process.env.NEXT_PUBLIC_BLOCK_OFFICE_ADDRESS,
    NEXT_PUBLIC_HYRE_BLOCK_ADDRESS: process.env.NEXT_PUBLIC_HYRE_BLOCK_ADDRESS
  }
};

module.exports = nextConfig;

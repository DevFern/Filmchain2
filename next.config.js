/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // For Vercel, you can remove the output: 'export' line if you want to use SSR
  // output: 'export',
  images: {
    domains: [
      'ipfs.io',
      'ipfs.infura.io',
      'gateway.pinata.cloud'
    ]
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api',
  },
  // Ensure proper output for Vercel
  output: 'standalone',
  // Don't fail build on linting errors (warnings)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Don't fail build on TypeScript errors (if any)
  typescript: {
    ignoreBuildErrors: false, // Keep this false to catch real TS errors
  },
};

module.exports = nextConfig;


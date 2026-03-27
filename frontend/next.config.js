/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production',
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:4000',
  },
}

module.exports = nextConfig
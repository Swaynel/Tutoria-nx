/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    AFRICAS_TALKING_API_KEY: process.env.AFRICAS_TALKING_API_KEY,
    AFRICAS_TALKING_USERNAME: process.env.AFRICAS_TALKING_USERNAME,
  },
  serverRuntimeConfig: {
    africastalkingApiKey: process.env.AFRICAS_TALKING_API_KEY,
    africastalkingUsername: process.env.AFRICAS_TALKING_USERNAME,
  },
}

module.exports = nextConfig
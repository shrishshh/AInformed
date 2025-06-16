/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['lh3.googleusercontent.com'], // Add any other image domains you need
  },
  experimental: {
    serverActions: true,
  },
}

export default nextConfig 
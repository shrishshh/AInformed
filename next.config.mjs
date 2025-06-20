/** @type {import('next').NextConfig} */
const nextConfig = {
  // Handle build warnings without failing
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  // Environment variables that should be available at build time
  /**
   * I recommend using https://env.t3.gg for validating you have all your environment variables set up correctly.
   * There's nothing that prevents me from starting the app with `NEXT_PUBLIC_APP_URL=not-a-url`, and your
   * app will fail in a place that might be harder to debug.
   * 
   * Using t3-env will let you define a `zod` schema for your environment variables, and then validate them at build time.
   * 
   * Example from the create-t3-turbo repo:
   * https://github.com/t3-oss/create-t3-turbo/blob/main/apps/nextjs/src/env.ts
   */
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    BREVO_SMTP_HOST: process.env.BREVO_SMTP_HOST,
    BREVO_SMTP_PORT: process.env.BREVO_SMTP_PORT,
    BREVO_SMTP_USER: process.env.BREVO_SMTP_USER,
    BREVO_SMTP_PASS: process.env.BREVO_SMTP_PASS,
  },
  
  // Ensure server-only packages are not bundled for client/edge runtime
  // These packages use Node.js APIs not available in Edge Runtime.
  experimental: {
    serverComponentsExternalPackages: [
      'jsonwebtoken',
      'handlebars',
      '@opentelemetry/sdk-node',
      '@opentelemetry/api',
      '@opentelemetry/exporter-jaeger',
      'dotprompt',
      'genkit',
      'require-in-the-middle',
    ],
  },

  // Image optimization configuration (allowing all HTTPS hostnames for debugging)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Webpack configuration to handle problematic modules
  // Why do you need this?
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    return config;
  },
}

export default nextConfig 
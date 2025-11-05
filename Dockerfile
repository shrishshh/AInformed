# Use Node.js 20 (Supabase recommends Node 20+)
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy dependency files first for better caching
COPY package*.json ./
COPY .npmrc ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Install any special dependencies
RUN npm install @opentelemetry/exporter-jaeger --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Accept build arguments (build-time only)
ARG MONGODB_URI
ARG JWT_SECRET
ARG NEXT_PUBLIC_APP_URL
ARG GOOGLE_REDIRECT_URI
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG BREVO_SMTP_HOST
ARG BREVO_SMTP_PORT
ARG BREVO_SMTP_USER
ARG BREVO_SMTP_PASS
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Set environment variables from build args (runtime visible)
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV MONGODB_URI=$MONGODB_URI
ENV JWT_SECRET=$JWT_SECRET
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV GOOGLE_REDIRECT_URI=$GOOGLE_REDIRECT_URI
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV BREVO_SMTP_HOST=$BREVO_SMTP_HOST
ENV BREVO_SMTP_PORT=$BREVO_SMTP_PORT
ENV BREVO_SMTP_USER=$BREVO_SMTP_USER
ENV BREVO_SMTP_PASS=$BREVO_SMTP_PASS
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Copy production env file if available (optional fallback)
# Note: This will fail if .env.production doesn't exist. 
# If you don't have this file, comment out the next line.
# COPY .env.production .env.local
RUN if [ -f .env.production ]; then cp .env.production .env.local; fi || true

# Build the Next.js application
RUN npm run build || (echo "Build failed. Checking what we have:" && ls -la && ls -la .next 2>/dev/null || echo 'No .next directory' && exit 1)

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]

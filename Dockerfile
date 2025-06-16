FROM node:18-alpine

# Install dependencies for sharp
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Install missing dependency that was causing warnings
RUN npm install @opentelemetry/exporter-jaeger --legacy-peer-deps

# Copy source code
COPY . .

# Set build-time environment variables received as ARG and then set as ENV
ARG NEXT_PUBLIC_APP_URL
ARG MONGODB_URI
ARG JWT_SECRET
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG GOOGLE_REDIRECT_URI
ARG BREVO_SMTP_HOST
ARG BREVO_SMTP_PORT
ARG BREVO_SMTP_USER
ARG BREVO_SMTP_PASS

ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV MONGODB_URI=${MONGODB_URI}
ENV JWT_SECRET=${JWT_SECRET}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
ENV GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI}
ENV BREVO_SMTP_HOST=${BREVO_SMTP_HOST}
ENV BREVO_SMTP_PORT=${BREVO_SMTP_PORT}
ENV BREVO_SMTP_USER=${BREVO_SMTP_USER}
ENV BREVO_SMTP_PASS=${BREVO_SMTP_PASS}

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application with explicit build arguments for Next.js
RUN echo "Checking MONGODB_URI: $MONGODB_URI" && \
    echo "Checking JWT_SECRET: $JWT_SECRET" && \
    echo "Checking NEXT_PUBLIC_APP_URL: $NEXT_PUBLIC_APP_URL" && \
    echo "Checking GOOGLE_REDIRECT_URI: $GOOGLE_REDIRECT_URI" && \
    npm run build -- \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    MONGODB_URI=$MONGODB_URI || (echo "Build failed. Checking what we have:" && ls -la && ls -la .next 2>/dev/null || echo "No .next directory" && exit 1)

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 
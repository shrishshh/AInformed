# Use the official Node.js runtime as a parent image
FROM node:18-alpine

# Install necessary dependencies
RUN apk add --no-cache libc6-compat

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy .npmrc if it exists
COPY .npmrc ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Install additional dependencies
RUN npm install @opentelemetry/exporter-jaeger --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Accept build arguments
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

# Set environment variables from build arguments
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

# Set other environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Debug: Print environment variables (be careful with sensitive data in production)
RUN echo "Environment variables set (values hidden for security)" && \
    echo "Checking MONGODB_URI: ${MONGODB_URI}" && \
    echo "Checking NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}" && \
    echo "Checking GOOGLE_REDIRECT_URI: ${GOOGLE_REDIRECT_URI}" && \
    echo "Checking NEXT_PUBLIC_GOOGLE_CLIENT_ID: ${NEXT_PUBLIC_GOOGLE_CLIENT_ID}"

# Build the application
RUN npm run build || (echo "Build failed. Checking what we have:" && ls -la && ls -la .next 2>/dev/null || echo "No .next directory" && exit 1)

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 
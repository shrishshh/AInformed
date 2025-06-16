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

# Set build-time environment variables
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV MONGODB_URI=mongodb+srv://your-mongodb-uri
ENV JWT_SECRET=your-jwt-secret-key
ENV GOOGLE_CLIENT_ID=your-google-client-id
ENV GOOGLE_CLIENT_SECRET=your-google-client-secret
ENV GOOGLE_REDIRECT_URI=${NEXT_PUBLIC_APP_URL}/api/auth/google/callback
ENV BREVO_SMTP_HOST=smtp-relay.brevo.com
ENV BREVO_SMTP_PORT=587
ENV BREVO_SMTP_USER=your-brevo-email
ENV BREVO_SMTP_PASS=your-brevo-api-key

# Build the application
RUN echo "Checking MONGODB_URI: $MONGODB_URI" && \
    echo "Checking JWT_SECRET: $JWT_SECRET" && \
    echo "Checking NEXT_PUBLIC_APP_URL: $NEXT_PUBLIC_APP_URL" && \
    echo "Checking GOOGLE_REDIRECT_URI: $GOOGLE_REDIRECT_URI" && \
    npm run build || (echo "Build failed. Checking what we have:" && ls -la && ls -la .next 2>/dev/null || echo "No .next directory" && exit 1)

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 
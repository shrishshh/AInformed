FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Install missing dependency that was causing warnings
RUN npm install @opentelemetry/exporter-jaeger --legacy-peer-deps

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application with better error handling
RUN npm run build || (echo "Build failed. Checking what we have:" && ls -la && ls -la .next 2>/dev/null || echo "No .next directory" && exit 1)

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 
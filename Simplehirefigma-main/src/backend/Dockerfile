FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# CRITICAL: Force clean install - remove all caches
RUN rm -rf node_modules package-lock.json dist .npm && \
    npm cache clean --force && \
    npm ci --only=production=false

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# CRITICAL: Remove any existing dist folder before build
RUN rm -rf dist

# Build TypeScript with verbose output
RUN npm run build

# Verify build output exists and show structure
RUN ls -la dist/ && \
    echo "Verifying errors.js exists:" && \
    ls -la dist/utils/errors.js || echo "ERROR: errors.js not found!"

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start server
CMD ["node", "dist/server.js"]

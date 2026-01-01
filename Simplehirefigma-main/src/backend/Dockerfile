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
    test -f dist/utils/errors.js && echo "✓ errors.js found" || (echo "ERROR: errors.js not found!" && exit 1)

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# Make startup script executable
RUN chmod +x scripts/startup.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start server with migrations and seeding
CMD ["./scripts/startup.sh"]

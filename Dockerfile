# Multi-stage build for Node.js backend with Prisma
FROM node:20-alpine AS base

# Install dependencies needed for Prisma and native modules
RUN apk add --no-cache libc6-compat openssl

# ============================================
# Dependencies stage - install all dependencies
# ============================================
FROM base AS deps
WORKDIR /app

# Copy backend package files
COPY Simplehirefigma-main/src/backend/package*.json ./backend/
COPY Simplehirefigma-main/src/backend/prisma ./backend/prisma/

# Install backend dependencies (including devDependencies for build)
WORKDIR /app/backend
RUN npm ci

# ============================================
# Builder stage - generate Prisma client and build TypeScript
# ============================================
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Copy backend source code
COPY Simplehirefigma-main/src/backend ./backend/

# Generate Prisma Client
WORKDIR /app/backend
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN npm run build

# ============================================
# Production stage - minimal runtime image
# ============================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules (production only)
COPY --from=deps /app/backend/node_modules ./node_modules

# Copy Prisma schema and migrations
COPY Simplehirefigma-main/src/backend/prisma ./prisma

# Copy built application
COPY --from=builder /app/backend/dist ./dist

# Generate Prisma Client in production image
RUN npx prisma generate

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs && \
    chown -R expressjs:nodejs /app

USER expressjs

# Expose the port your backend runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start command: run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

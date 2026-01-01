# Multi-stage build for Node.js backend with Prisma
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY Simplehirefigma-main/package*.json ./Simplehirefigma-main/
COPY Simplehirefigma-main/src/backend/package*.json ./Simplehirefigma-main/src/backend/
COPY Simplehirefigma-main/src/backend/prisma ./Simplehirefigma-main/src/backend/prisma/

# CRITICAL: Nuclear option - remove EVERYTHING
RUN rm -rf node_modules package-lock.json dist .npm .cache && \
    rm -rf Simplehirefigma-main/node_modules && \
    rm -rf Simplehirefigma-main/dist && \
    rm -rf Simplehirefigma-main/src/backend/node_modules && \
    rm -rf Simplehirefigma-main/src/backend/dist && \
    npm cache clean --force && \
    npm cache verify

# Install root dependencies
# Cache bust: Dec 30 2025 1520
RUN npm install

# Install frontend dependencies
WORKDIR /app/Simplehirefigma-main
RUN npm install

# Install backend dependencies
WORKDIR /app/Simplehirefigma-main/src/backend
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy ALL source code
WORKDIR /app
COPY . .

# Build frontend
WORKDIR /app/Simplehirefigma-main
RUN rm -rf dist
RUN npm run build 2>&1 | tee frontend-build.log
RUN test -d dist || (echo "ERROR: Frontend dist directory missing!" && cat frontend-build.log && exit 1)

# Build backend
WORKDIR /app/Simplehirefigma-main/src/backend

# Remove dist again right before build
RUN rm -rf dist

# Build with verbose logging
RUN npm run build 2>&1 | tee build.log

# Verify critical files exist
RUN test -f dist/utils/errors.js || (echo "ERROR: errors.js missing!" && cat build.log && exit 1)
RUN test -f dist/server.js || (echo "ERROR: server.js missing!" && cat build.log && exit 1)

# Show compiled errors.js for verification
RUN echo "=== Compiled errors.js content ===" && head -50 dist/utils/errors.js

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/Simplehirefigma-main/src/backend/dist ./dist
COPY --from=builder /app/Simplehirefigma-main/src/backend/node_modules ./node_modules
COPY --from=builder /app/Simplehirefigma-main/src/backend/package*.json ./
COPY --from=builder /app/Simplehirefigma-main/src/backend/prisma ./prisma
COPY --from=builder /app/Simplehirefigma-main/src/backend/scripts ./scripts
COPY --from=builder /app/Simplehirefigma-main/src/backend/config ./config
COPY --from=builder /app/Simplehirefigma-main/dist ./public

# Runtime verification
RUN node -e "try { require('./dist/utils/errors'); console.log('✓ errors.js loads successfully'); } catch(e) { console.error('✗ errors.js failed to load:', e); process.exit(1); }"

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:' + (process.env.PORT || '8080') + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => { process.exit(1); });"

# Start server with verification
CMD ["sh", "-c", "npx prisma migrate deploy && node scripts/verify-runtime.js && node dist/server.js"]

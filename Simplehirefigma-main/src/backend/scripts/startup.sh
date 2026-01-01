#!/bin/sh
# Startup script for production deployment
# Runs database migrations and seeding before starting the server

set -e

echo "🚀 Starting application initialization..."

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Run database seeding (idempotent - safe to run multiple times)
echo "🌱 Running database seed..."
if npm run prisma:seed; then
  echo "✅ Database seeding completed successfully"
else
  echo "⚠️  Database seeding failed (exit code: $?)"
  echo "⚠️  This is non-critical if users already exist. Continuing..."
fi

# Verify runtime environment
echo "✅ Verifying runtime environment..."
node scripts/verify-runtime.js

# Start the server
echo "🎯 Starting server..."
exec node dist/server.js

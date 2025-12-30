# Test and CI/CD Configuration Guide

## Overview
This document provides guidance on running tests and understanding the CI/CD pipeline for the Simplehire backend application.

## Test Requirements

### Prerequisites
The test suite requires:
1. **PostgreSQL Database**: Tests connect to a PostgreSQL database
2. **Environment Variables**: Properly configured test environment
3. **Prisma Setup**: Generated Prisma client and applied migrations

### Local Testing

To run tests locally:

```bash
# Navigate to backend directory
cd Simplehirefigma-main/src/backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Set up test database (one-time)
# Create a PostgreSQL database for testing
createdb simplehire_test

# Run migrations
DATABASE_URL="postgresql://user:password@localhost:5432/simplehire_test" npx prisma migrate deploy

# Run tests
DATABASE_URL="postgresql://user:password@localhost:5432/simplehire_test" \
JWT_SECRET="test-jwt-secret-minimum-32-characters-long" \
JWT_REFRESH_SECRET="test-refresh-secret-minimum-32-chars" \
npm test
```

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/backend-ci.yml`) automatically:

1. **Sets up PostgreSQL service**: Runs postgres:16-alpine container
2. **Installs dependencies**: Uses `npm ci` for clean install
3. **Generates Prisma client**: Runs `npx prisma generate`
4. **Runs migrations**: Applies database migrations
5. **Lints code**: Runs ESLint
6. **Type checks**: Runs TypeScript compiler
7. **Runs tests**: Executes Jest test suite
8. **Security audit**: Checks for vulnerabilities

### Test Configuration

Tests are configured in `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // ...
};
```

### Test Setup

The `tests/setup.ts` file:
- Configures test environment variables
- Cleans database tables before each test run
- Sets up global test fixtures

## Current Test Status

### Passing Tests
- ✅ Multi-LLM Arbiter Service tests (9/9)
- ✅ Assessment Planning tests
- ✅ Unit tests that don't require database

### Database-Dependent Tests
Tests requiring database connection may fail locally if:
- PostgreSQL is not running
- Database URL is not configured
- Migrations are not applied

These tests run successfully in CI/CD where PostgreSQL service is available.

## Troubleshooting

### "Can't reach database server"
**Problem**: Tests fail with database connection error

**Solution**:
1. Ensure PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL environment variable
3. Verify database exists: `psql -l`
4. Apply migrations: `npx prisma migrate deploy`

### "Invalid `prisma.$queryRaw()` invocation"
**Problem**: Prisma client cannot connect

**Solution**:
1. Regenerate Prisma client: `npx prisma generate`
2. Check DATABASE_URL format: `postgresql://user:password@host:port/database`
3. Test connection: `psql $DATABASE_URL -c "SELECT 1"`

### "Worker process has failed to exit gracefully"
**Problem**: Tests leave open handles

**Solution**:
1. This is expected when database is not available
2. Tests attempt to retry database connection with timeouts
3. Run with `--detectOpenHandles` to identify: `npm test -- --detectOpenHandles`

## Test Coverage

Run tests with coverage:

```bash
npm run test:coverage
```

This generates a coverage report in the `coverage/` directory.

## Adding New Tests

When adding new tests:

1. **Place in `tests/` directory**: Follow existing naming convention
2. **Import test setup**: Use shared setup from `tests/setup.ts`
3. **Mock external services**: Mock AWS, Stripe, email services
4. **Handle database**: Use transactions for isolation
5. **Clean up**: Ensure proper teardown

Example test structure:

```typescript
import request from 'supertest';
import app from '../src/server';

describe('Feature Name', () => {
  it('should do something', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## CI/CD Workflow Triggers

The backend CI workflow runs on:
- **Push to main or develop**: Validates changes before merge
- **Pull requests**: Ensures code quality
- **Manual trigger**: Can be run on-demand

## Best Practices

1. **Run tests locally**: Before pushing changes
2. **Check CI logs**: Review GitHub Actions output
3. **Fix failures promptly**: Don't let test debt accumulate
4. **Mock external services**: Avoid dependencies on external APIs
5. **Keep tests fast**: Aim for quick feedback loops

## Contact

For questions or issues with tests:
- Check `TROUBLESHOOTING.md`
- Review test logs in GitHub Actions
- Consult `README.md` for project setup

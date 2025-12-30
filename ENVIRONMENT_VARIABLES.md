# Environment Variables Documentation

This document provides a comprehensive guide to all environment variables used in the Simplehire application.

## Table of Contents

- [Required Variables](#required-variables)
- [Optional Variables](#optional-variables)
  - [AI/LLM Services](#aillm-services)
  - [File Storage](#file-storage)
  - [Payment Processing](#payment-processing)
  - [Email Service](#email-service)
  - [OAuth Providers](#oauth-providers)
  - [Rate Limiting](#rate-limiting)
  - [File Upload Limits](#file-upload-limits)
  - [Session Management](#session-management)
  - [Logging](#logging)
- [Variable Validation](#variable-validation)
- [Setup Instructions](#setup-instructions)

---

## Required Variables

These variables **must** be configured for the application to start successfully.

### `DATABASE_URL`

- **Description**: PostgreSQL database connection string
- **Format**: `postgresql://username:password@host:port/database`
- **Example**: `postgresql://user:pass@localhost:5432/simplehire`
- **Notes**: 
  - Must start with `postgresql://` or `postgres://`
  - Automatically provided by Railway PostgreSQL plugin
  - For local development, ensure PostgreSQL is running

### `JWT_SECRET`

- **Description**: Secret key for signing JWT access tokens
- **Format**: String, minimum 32 characters recommended
- **Example**: `your-super-secret-jwt-key-min-64-chars`
- **Generate**: `openssl rand -hex 32`
- **Notes**:
  - Must be at least 32 characters for security
  - Should be different from `JWT_REFRESH_SECRET`
  - Never commit this to version control

### `JWT_REFRESH_SECRET`

- **Description**: Secret key for signing JWT refresh tokens
- **Format**: String, minimum 32 characters recommended
- **Example**: `your-super-secret-refresh-key-min-64-chars`
- **Generate**: `openssl rand -hex 32`
- **Notes**:
  - Must be at least 32 characters for security
  - Should be different from `JWT_SECRET`
  - Never commit this to version control

---

## Optional Variables

These variables are optional but may be required for specific features.

### Server Configuration

#### `PORT`

- **Description**: Port number the server listens on
- **Default**: `3000`
- **Example**: `3000`
- **Notes**: Automatically set by Railway and other cloud platforms

#### `NODE_ENV`

- **Description**: Application environment
- **Values**: `development`, `production`, `test`
- **Default**: `development`
- **Example**: `production`
- **Notes**: 
  - Affects logging, error handling, and performance optimizations
  - Set to `production` for deployments

#### `APP_URL`

- **Description**: Backend application URL
- **Format**: Full URL including protocol
- **Example**: `https://api.simplehire.com`
- **Notes**: Used for generating links and callbacks

#### `FRONTEND_URL`

- **Description**: Frontend application URL for CORS configuration
- **Format**: Full URL including protocol
- **Example**: `https://app.simplehire.com`
- **Notes**: Required for proper CORS setup

### JWT Configuration

#### `JWT_EXPIRES_IN`

- **Description**: Access token expiration time
- **Default**: `15m`
- **Example**: `15m`, `1h`, `30d`
- **Notes**: Short duration recommended for security

#### `REFRESH_TOKEN_EXPIRES_IN`

- **Description**: Refresh token expiration time
- **Default**: `7d`
- **Example**: `7d`, `30d`
- **Notes**: Longer duration than access token

### Security

#### `BCRYPT_ROUNDS`

- **Description**: Number of bcrypt hashing rounds
- **Default**: `12`
- **Example**: `12`
- **Notes**: Higher values are more secure but slower (10-12 recommended)

---

## AI/LLM Services

### `OPENAI_API_KEY`

- **Description**: OpenAI API key for GPT models
- **Format**: Starts with `sk-`
- **Example**: `sk-proj-abc123...`
- **Required For**: Resume analysis, multi-LLM evaluation
- **Notes**: 
  - Get from https://platform.openai.com/api-keys
  - Used for resume parsing and candidate evaluation
  - **Feature Impact**: Without this, AI-powered resume analysis will be disabled

### `ANTHROPIC_API_KEY`

- **Description**: Anthropic API key for Claude models
- **Format**: Starts with `sk-ant-`
- **Example**: `sk-ant-api03-abc123...`
- **Required For**: Multi-LLM evaluation (when enabled)
- **Notes**: 
  - Get from https://console.anthropic.com/
  - Used for comparative AI evaluation
  - **Feature Impact**: Multi-LLM arbiter requires both OpenAI and Anthropic keys

### `LLM_PROVIDERS`

- **Description**: Comma-separated list of LLM providers to use
- **Default**: `gpt-4o`
- **Example**: `gpt-4o,claude-opus-4-5-20251101`
- **Notes**: Must have corresponding API keys configured

### `ENABLE_MULTI_LLM_ARBITER`

- **Description**: Enable multi-LLM evaluation for improved accuracy
- **Values**: `true`, `false`
- **Default**: `false`
- **Example**: `true`
- **Notes**: Requires both OPENAI_API_KEY and ANTHROPIC_API_KEY

---

## File Storage

### `AWS_ACCESS_KEY_ID`

- **Description**: AWS access key for S3 storage
- **Format**: Alphanumeric string
- **Example**: `AKIAIOSFODNN7EXAMPLE`
- **Required For**: File uploads (resumes, ID documents, certificates)
- **Notes**: 
  - Get from AWS IAM console
  - Requires S3 permissions
  - **Feature Impact**: Without S3 configuration, file uploads will fail

### `AWS_SECRET_ACCESS_KEY`

- **Description**: AWS secret key for S3 storage
- **Format**: Base64-like string
- **Example**: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
- **Required For**: File uploads
- **Notes**: Never commit this to version control

### `AWS_REGION`

- **Description**: AWS region for S3 bucket
- **Default**: `us-east-1`
- **Example**: `us-west-2`
- **Notes**: Must match your S3 bucket region

### `AWS_S3_BUCKET`

- **Description**: S3 bucket name for file storage
- **Example**: `simplehire-storage`
- **Required For**: File uploads
- **Notes**: Bucket must exist and be accessible with provided credentials

### `AWS_ENDPOINT`

- **Description**: Custom S3 endpoint (for S3-compatible services)
- **Example**: `http://localhost:9000` (for MinIO)
- **Notes**: Optional, only needed for local development with MinIO or other S3-compatible services

---

## Payment Processing

### `STRIPE_SECRET_KEY`

- **Description**: Stripe secret key for payment processing
- **Format**: Starts with `sk_test_` or `sk_live_`
- **Example**: `sk_test_abc123...`
- **Required For**: Payment processing
- **Notes**: 
  - Get from https://dashboard.stripe.com/apikeys
  - Use test key for development, live key for production
  - **Feature Impact**: Without Stripe configuration, payment features will be disabled

### `STRIPE_PUBLISHABLE_KEY`

- **Description**: Stripe publishable key
- **Format**: Starts with `pk_test_` or `pk_live_`
- **Example**: `pk_test_abc123...`
- **Required For**: Frontend payment integration
- **Notes**: Safe to expose in frontend code

### `STRIPE_WEBHOOK_SECRET`

- **Description**: Stripe webhook secret for event validation
- **Format**: Starts with `whsec_`
- **Example**: `whsec_abc123...`
- **Required For**: Stripe webhook events
- **Notes**: Get from Stripe webhook configuration

---

## Email Service

### `EMAIL_FROM`

- **Description**: Sender email address
- **Default**: `noreply@simplehire.ai`
- **Example**: `support@yourdomain.com`
- **Notes**: Must be verified in your email service

### `EMAIL_FROM_NAME`

- **Description**: Sender name for emails
- **Default**: `Simplehire`
- **Example**: `Your Company Name`

### `SENDGRID_API_KEY`

- **Description**: SendGrid API key for email delivery
- **Format**: Starts with `SG.`
- **Example**: `SG.abc123...`
- **Required For**: Email notifications (reference checks, verification results)
- **Notes**: 
  - Get from https://app.sendgrid.com/settings/api_keys
  - **Feature Impact**: Without email configuration, notification emails won't be sent

---

## OAuth Providers

### `GOOGLE_CLIENT_ID`

- **Description**: Google OAuth client ID
- **Format**: Ends with `.apps.googleusercontent.com`
- **Example**: `123456789-abc.apps.googleusercontent.com`
- **Required For**: Google OAuth authentication
- **Notes**: Get from Google Cloud Console

### `GOOGLE_CLIENT_SECRET`

- **Description**: Google OAuth client secret
- **Format**: Alphanumeric string
- **Example**: `GOCSPX-abc123...`
- **Required For**: Google OAuth authentication
- **Notes**: Never commit this to version control

---

## Rate Limiting

### `RATE_LIMIT_WINDOW_MS`

- **Description**: Time window for rate limiting in milliseconds
- **Default**: `900000` (15 minutes)
- **Example**: `900000`
- **Notes**: Used for general API rate limiting

### `RATE_LIMIT_MAX_REQUESTS`

- **Description**: Maximum requests per window
- **Default**: `100`
- **Example**: `100`
- **Notes**: Adjust based on your traffic needs

### `LOGIN_RATE_LIMIT_MAX`

- **Description**: Maximum login attempts per window
- **Default**: `5`
- **Example**: `5`
- **Notes**: Helps prevent brute-force attacks

---

## File Upload Limits

### `MAX_FILE_SIZE`

- **Description**: Maximum file size for document uploads (in bytes)
- **Default**: `10485760` (10 MB)
- **Example**: `16777216` (16 MB)
- **Notes**: Applies to resumes, ID documents

### `MAX_AUDIO_SIZE`

- **Description**: Maximum audio file size (in bytes)
- **Default**: `52428800` (50 MB)
- **Example**: `52428800`
- **Notes**: Applies to interview recordings

---

## Session Management

### `SESSION_MAX_AGE_MS`

- **Description**: Session maximum age in milliseconds
- **Default**: `3600000` (1 hour)
- **Example**: `3600000`
- **Notes**: Used for proctored assessment sessions

---

## Logging

### `LOG_LEVEL`

- **Description**: Logging level for the application
- **Values**: `error`, `warn`, `info`, `debug`, `verbose`
- **Default**: `info`
- **Example**: `debug`
- **Notes**: 
  - Use `debug` for development
  - Use `info` or `warn` for production
  - Higher levels log more information

---

## Variable Validation

The application automatically validates environment variables on startup:

### Critical Validation
- **Missing Required Variables**: Application will **not start** if any required variable is missing
- **Database URL Format**: Must be a valid PostgreSQL connection string
- **JWT Secret Length**: Warning if less than 32 characters
- **JWT Secret Uniqueness**: Warning if JWT_SECRET equals JWT_REFRESH_SECRET

### Warnings
- Missing recommended variables log warnings but don't prevent startup
- Feature-specific variables are checked and feature availability is logged

### Feature Availability Report
On startup, the application logs which features are enabled based on configured variables:

```
=== Feature Availability ===
✓ Multi-LLM Evaluation: Enabled
✓ File Uploads (S3): Enabled
✓ Payment Processing: Enabled
✗ Email Service: Disabled (not configured)
✗ OAuth: Disabled (not configured)
============================
```

---

## Setup Instructions

### Local Development

1. **Copy the example file:**
   ```bash
   cd Simplehirefigma-main/src/backend
   cp .env.example .env
   ```

2. **Set required variables:**
   ```bash
   # Generate JWT secrets
   openssl rand -hex 32  # Use for JWT_SECRET
   openssl rand -hex 32  # Use for JWT_REFRESH_SECRET
   ```

3. **Configure database:**
   ```bash
   # For local PostgreSQL
   DATABASE_URL=postgresql://postgres:password@localhost:5432/simplehire
   ```

4. **Add optional variables** based on features you want to use

5. **Validate configuration:**
   ```bash
   npm run dev
   # Check startup logs for validation results
   ```

### Railway Deployment

1. **In Railway dashboard, go to your service → Variables**

2. **Add required variables:**
   - `DATABASE_URL` - Automatically set by PostgreSQL plugin
   - `JWT_SECRET` - Generate with `openssl rand -hex 32`
   - `JWT_REFRESH_SECRET` - Generate with `openssl rand -hex 32`

3. **Add optional variables** for features you want to enable

4. **Deploy:**
   - Railway will automatically redeploy with new variables
   - Check deployment logs for validation results

### Docker Deployment

1. **Create `.env` file** in project root

2. **Set all required variables**

3. **Build and run:**
   ```bash
   docker build -t simplehire .
   docker run --env-file .env -p 3000:3000 simplehire
   ```

---

## Troubleshooting

### "Missing required environment variable"
- Check that the variable is set in your environment
- For Railway, ensure variable is added in dashboard
- For Docker, verify `.env` file exists and is properly formatted
- Variable names are case-sensitive

### "DATABASE_URL must be a valid PostgreSQL connection string"
- Ensure URL starts with `postgresql://` or `postgres://`
- Check format: `postgresql://user:password@host:port/database`
- Verify no special characters need URL encoding

### "JWT_SECRET should be at least 32 characters"
- Generate stronger secrets using `openssl rand -hex 32`
- Update both JWT_SECRET and JWT_REFRESH_SECRET

### Feature Not Working
- Check startup logs for feature availability report
- Verify all required variables for that feature are set
- Check that API keys are valid and not expired

---

## Security Best Practices

1. **Never commit secrets to version control**
   - Use `.env` for local development
   - Add `.env` to `.gitignore`
   - Use cloud platform variable management for production

2. **Generate strong secrets**
   - Use `openssl rand -hex 32` for JWT secrets
   - Minimum 32 characters for all secrets

3. **Rotate secrets regularly**
   - Change JWT secrets periodically
   - Update API keys if compromised
   - Use different secrets for different environments

4. **Use environment-specific values**
   - Test keys for development
   - Live keys for production
   - Never use production keys in development

5. **Limit access to secrets**
   - Only team members who need access should have it
   - Use role-based access in cloud platforms
   - Audit secret access regularly

---

## Additional Resources

- [.env.example](.env.example) - Template with all variables
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions
- [RAILWAY_SETUP.md](RAILWAY_SETUP.md) - Railway deployment guide
- [README.md](README.md) - General project documentation

---

**Last Updated:** December 30, 2024

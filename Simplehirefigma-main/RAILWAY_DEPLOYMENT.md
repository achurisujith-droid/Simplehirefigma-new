# Railway Deployment Guide

## Prerequisites
- Railway account (railway.app)
- GitHub repository connected to Railway

## Environment Variables (Set in Railway Dashboard)

### Database
- `DATABASE_URL` - Auto-provided by Railway PostgreSQL plugin

### Authentication
- `JWT_SECRET` - Generate: `openssl rand -hex 32`
- `REFRESH_TOKEN_SECRET` - Generate: `openssl rand -hex 32`

### OpenAI
- `OPENAI_API_KEY` - Your OpenAI API key (required for dynamic question generation)

### AWS (for file uploads)
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- `AWS_REGION` - e.g., `us-east-1`
- `AWS_S3_BUCKET` - Your S3 bucket name

### Anthropic (optional, for multi-LLM evaluation)
- `ANTHROPIC_API_KEY` - Your Anthropic API key (optional)

### Application
- `NODE_ENV` - Set to `production`
- `PORT` - Railway will auto-assign (usually 3000)

## Deployment Steps

### 1. Add PostgreSQL Plugin
In Railway dashboard:
- Click "New" → "Database" → "Add PostgreSQL"
- Railway will automatically create and inject `DATABASE_URL`

### 2. Set Environment Variables
In Railway dashboard, go to your service settings and add all environment variables listed above.

**Quick Generate Secrets:**
```bash
# Generate JWT_SECRET
openssl rand -hex 32

# Generate REFRESH_TOKEN_SECRET
openssl rand -hex 32
```

### 3. Deploy Backend
Railway auto-deploys on git push to main branch:
```bash
git push origin main
```

The Dockerfile will:
1. Install dependencies
2. Generate Prisma Client
3. Build TypeScript
4. Run database migrations
5. Start the server

### 4. Verify Deployment
Once deployed:
1. Visit `https://your-app.up.railway.app/health`
2. Should return `{"status":"ok"}`

## Testing Dynamic Question Generation

### 1. Login with Test User
```bash
curl -X POST https://your-app.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"your-password"}'
```

### 2. Upload Resume and Start Assessment
```bash
# Upload resume to create assessment plan
curl -X POST https://your-app.up.railway.app/api/assessment/start-assessment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "resume=@path/to/resume.pdf"
```

### 3. Fetch Dynamic MCQ Questions
```bash
curl https://your-app.up.railway.app/api/interviews/mcq \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Fetch Dynamic Coding Challenges
```bash
curl https://your-app.up.railway.app/api/interviews/coding \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Connecting to Existing Database

If you want to use your existing database with test users:

1. In Railway, go to PostgreSQL plugin
2. Copy the `DATABASE_URL`
3. Use this URL in your `.env` for local development
4. Existing users will be preserved

## Monitoring

### View Logs
In Railway dashboard:
- Click on your service
- Go to "Deployments" tab
- Click on active deployment
- View logs in real-time

### Common Log Patterns
- `✓ Prisma Client generated` - Database setup successful
- `Server running on port 3000` - Server started successfully
- `Generating X MCQ questions` - Dynamic question generation working
- `Profile classified as:` - Resume analysis working

## Troubleshooting

### "Prisma Client not generated"
**Cause:** Build step failed to generate Prisma Client

**Solution:**
1. Check Railway build logs
2. Ensure `npx prisma generate` runs in Dockerfile
3. Verify `prisma/schema.prisma` exists in repository

### "Database connection failed"
**Cause:** Invalid or missing `DATABASE_URL`

**Solution:**
1. Verify `DATABASE_URL` is set correctly in environment variables
2. Check PostgreSQL plugin is running
3. Ensure database migration ran successfully

### "OpenAI API error"
**Cause:** Invalid API key or quota exceeded

**Solution:**
1. Verify `OPENAI_API_KEY` is valid
2. Check OpenAI API quota/billing at platform.openai.com
3. Check Railway logs for specific error message

### "No questions generated - using fallback"
**Cause:** OpenAI API call failed or returned invalid response

**Solution:**
1. Check OpenAI API key is valid
2. Verify internet connectivity from Railway
3. Check Railway logs for OpenAI error details
4. Fallback questions will be used automatically

## Performance Optimization

### Database Connection Pooling
Already configured in Prisma. Connection pool size:
- Default: 10 connections
- Adjust in `DATABASE_URL`: `?connection_limit=20`

### OpenAI API Rate Limits
- GPT-4o: 500 requests per minute
- If hitting limits, add retry logic or upgrade OpenAI tier

### Caching
Resume analysis is cached to reduce OpenAI API calls:
- Cache key: SHA-256 of resume text
- TTL: 24 hours
- Storage: In-memory (cleared on restart)

## Scaling

### Horizontal Scaling
Railway supports horizontal scaling:
1. Go to service settings
2. Under "Scaling", increase replica count
3. Note: Shared database will handle multiple instances

### Vertical Scaling
Increase memory/CPU:
1. Go to service settings
2. Upgrade plan for more resources

## Security Best Practices

### 1. Rotate Secrets Regularly
```bash
# Generate new JWT secrets
openssl rand -hex 32

# Update in Railway dashboard
```

### 2. Enable CORS Properly
In production, set specific origins:
```typescript
// In backend config
cors: {
  origin: 'https://your-frontend-domain.com',
  credentials: true
}
```

### 3. API Rate Limiting
Already configured in backend:
- Auth endpoints: 5 requests per 15 minutes
- General endpoints: 100 requests per 15 minutes

### 4. Database Backups
Railway PostgreSQL includes:
- Automatic daily backups
- 7-day retention
- Manual backup option in dashboard

## Cost Estimation

**Note:** Prices are estimates as of December 2024 and may change. Always verify current pricing at respective service providers.

### Railway Costs
- Starter plan: $5/month
- Includes: 500 hours runtime, 512MB RAM, 1GB disk

### OpenAI Costs (GPT-4o)
Per assessment:
- Resume analysis: ~$0.01
- MCQ generation (12 questions): ~$0.05
- Coding challenge generation (2-3): ~$0.03
- Code evaluation: ~$0.02 per submission

**Total per candidate: ~$0.11**

For 1000 assessments/month: ~$110

**Important:** Verify current OpenAI pricing at https://openai.com/pricing

### AWS S3 Costs
- Storage: $0.023 per GB
- Requests: $0.005 per 1000 GET requests
- Typical: <$5/month for 1000 resumes

## Support

### Railway Support
- Documentation: docs.railway.app
- Discord: railway.app/discord
- Email: team@railway.app

### Application Issues
- Check GitHub Issues
- Review Railway deployment logs
- Check OpenAI status: status.openai.com

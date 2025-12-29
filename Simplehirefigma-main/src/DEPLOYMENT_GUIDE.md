# Simplehire Deployment Guide

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Build Process](#build-process)
4. [Deployment Options](#deployment-options)
5. [Post-Deployment](#post-deployment)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Code linted and formatted
- [ ] TypeScript compilation successful
- [ ] Dependencies updated (security patches)
- [ ] Unused dependencies removed

### Security
- [ ] Environment variables properly configured
- [ ] No sensitive data in code
- [ ] API keys stored securely
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Content Security Policy (CSP) headers set

### Performance
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Lazy loading configured
- [ ] Bundle size analyzed and optimized
- [ ] Caching strategy implemented

### Functionality
- [ ] All features tested
- [ ] Forms validation working
- [ ] File uploads working
- [ ] Payment flow tested (use Stripe test mode)
- [ ] Mobile responsiveness verified
- [ ] Cross-browser compatibility tested

---

## Environment Setup

### 1. Production Environment Variables

Create a `.env.production` file:

```bash
# API Configuration
VITE_API_BASE_URL=https://api.simplehire.ai/api
VITE_ENVIRONMENT=production

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-production-google-client-id

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Analytics (optional)
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### 2. Staging Environment Variables

Create a `.env.staging` file:

```bash
VITE_API_BASE_URL=https://staging-api.simplehire.ai/api
VITE_ENVIRONMENT=staging
VITE_GOOGLE_CLIENT_ID=your-staging-google-client-id
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Build Process

### 1. Install Dependencies

```bash
npm install
```

### 2. Build for Production

```bash
# Production build
npm run build

# Staging build
npm run build -- --mode staging
```

### 3. Preview Build Locally

```bash
npm run preview
```

### 4. Analyze Bundle Size

```bash
# Install bundle analyzer
npm install --save-dev vite-plugin-bundle-analyzer

# Add to vite.config.ts
import { visualizer } from 'vite-plugin-bundle-analyzer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })
  ]
});

# Build and analyze
npm run build
```

---

## Deployment Options

### Option 1: Vercel (Recommended for Easy Setup)

#### Prerequisites
- Vercel account
- GitHub repository

#### Steps

1. **Connect Repository**
   ```bash
   npm install -g vercel
   vercel login
   vercel link
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all variables from `.env.production`

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Auto-Deploy Setup**
   - Push to `main` branch triggers production deployment
   - Push to `develop` branch triggers preview deployment

#### vercel.json Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

### Option 2: Netlify

#### Prerequisites
- Netlify account
- GitHub repository

#### Steps

1. **Create netlify.toml**
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200

   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-Content-Type-Options = "nosniff"
       X-XSS-Protection = "1; mode=block"
   ```

2. **Deploy**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod
   ```

---

### Option 3: AWS S3 + CloudFront

#### Prerequisites
- AWS account
- AWS CLI configured

#### Steps

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://simplehire-app --region us-east-1
   ```

3. **Configure Bucket for Static Hosting**
   ```bash
   aws s3 website s3://simplehire-app \
     --index-document index.html \
     --error-document index.html
   ```

4. **Upload Files**
   ```bash
   aws s3 sync dist/ s3://simplehire-app --delete
   ```

5. **Set Up CloudFront Distribution**
   - Origin: S3 bucket
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Custom Error Response: 404 → /index.html (200)
   - Enable compression
   - Set TTL for caching

6. **Configure DNS**
   - Point your domain to CloudFront distribution
   - Set up SSL certificate (AWS Certificate Manager)

---

### Option 4: Docker Deployment

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

#### Build and Run

```bash
# Build image
docker build -t simplehire-app .

# Run container
docker run -p 80:80 simplehire-app

# Or use docker-compose
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

---

### Option 5: Traditional Server (VPS)

#### Prerequisites
- Ubuntu 20.04+ server
- Domain pointed to server
- SSH access

#### Steps

1. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install Nginx**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

3. **Clone and Build**
   ```bash
   cd /var/www
   git clone https://github.com/your-org/simplehire-app.git
   cd simplehire-app
   npm install
   npm run build
   ```

4. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/simplehire
   ```

   ```nginx
   server {
       listen 80;
       server_name simplehire.ai www.simplehire.ai;

       root /var/www/simplehire-app/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

5. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/simplehire /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

6. **Set Up SSL (Let's Encrypt)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d simplehire.ai -d www.simplehire.ai
   ```

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Check if site is accessible
curl -I https://simplehire.ai

# Check for 404s
curl https://simplehire.ai/non-existent-page
# Should redirect to index.html
```

### 2. Test Critical Paths

- [ ] Login/Signup flow
- [ ] Product purchase flow
- [ ] File uploads
- [ ] Certificate generation
- [ ] Mobile responsiveness
- [ ] All navigation links

### 3. Performance Testing

```bash
# Use Lighthouse
npm install -g lighthouse
lighthouse https://simplehire.ai --view

# Or use WebPageTest
# https://www.webpagetest.org/
```

### 4. Set Up Monitoring

#### Google Analytics

Add to `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

#### Sentry Error Tracking

```bash
npm install @sentry/react
```

```typescript
// main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENVIRONMENT,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

#### Uptime Monitoring

- Set up monitoring with UptimeRobot or Pingdom
- Configure alerts for downtime
- Monitor critical endpoints

---

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
          VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
          VITE_STRIPE_PUBLISHABLE_KEY: ${{ secrets.VITE_STRIPE_PUBLISHABLE_KEY }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Staging Deployment

Create `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      # ... same as production but use staging secrets
      - name: Build application
        run: npm run build -- --mode staging
        env:
          VITE_API_BASE_URL: ${{ secrets.STAGING_API_BASE_URL }}
```

---

## Monitoring & Maintenance

### Daily Checks
- [ ] Check error logs (Sentry)
- [ ] Monitor uptime status
- [ ] Review user feedback

### Weekly Maintenance
- [ ] Review performance metrics
- [ ] Check security vulnerabilities
- [ ] Update dependencies (patch versions)

### Monthly Tasks
- [ ] Full security audit
- [ ] Performance optimization review
- [ ] Backup verification
- [ ] Update dependencies (minor versions)

---

## Rollback Procedures

### Vercel Rollback

```bash
# List deployments
vercel list

# Rollback to specific deployment
vercel rollback <deployment-url>
```

### Manual Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or checkout previous version
git checkout <previous-commit-hash>
git push origin main --force
```

### Docker Rollback

```bash
# Keep previous image tagged
docker tag simplehire-app:latest simplehire-app:previous

# Rollback
docker stop simplehire-app
docker run -d --name simplehire-app simplehire-app:previous
```

---

## Troubleshooting

### Common Issues

#### 1. 404 on Page Refresh
**Problem**: Single-page app routing not configured on server

**Solution**: Configure server to redirect all requests to index.html

#### 2. Environment Variables Not Working
**Problem**: Build-time variables not set correctly

**Solution**: 
- Ensure variables start with `VITE_`
- Rebuild after changing variables
- Check `.env.production` file

#### 3. CORS Errors
**Problem**: API requests blocked by browser

**Solution**: Configure CORS on backend to allow your domain

#### 4. Slow Load Times
**Problem**: Large bundle size or slow server

**Solution**:
- Enable code splitting
- Optimize images
- Use CDN
- Enable gzip compression

---

## Support

For deployment issues:
- GitHub Issues: https://github.com/your-org/simplehire-app/issues
- Email: devops@simplehire.ai
- Slack: #simplehire-deployments

---

**Document Version**: 1.0  
**Last Updated**: January 2025

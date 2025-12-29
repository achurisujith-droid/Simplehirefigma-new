# Quick Reference Card

## 🚀 Get Running in 5 Minutes

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env
# Edit .env: Set DATABASE_URL and JWT_SECRET
npm run prisma:generate && npm run prisma:migrate
npm run dev

# 2. Frontend (new terminal)
cd ..
# Make sure .env.local has: VITE_API_BASE_URL=http://localhost:3000/api
mv App.tsx App-OLD.tsx && mv App-NEW.tsx App.tsx
npm run dev

# 3. Open http://localhost:5173
```

---

## 📂 Key Files

| File | Purpose |
|------|---------|
| `/App-NEW.tsx` | **Use this!** Backend-integrated App.tsx |
| `/App.tsx` | Old localStorage version (backup as App-OLD.tsx) |
| `/src/hooks/useAuth.ts` | Backend authentication hook |
| `/src/services/*.service.ts` | API service layer (already existed!) |
| `/backend/src/server.ts` | Backend entry point |
| `/backend/prisma/schema.prisma` | Database schema (11 tables) |
| `/backend/.env` | Backend config (copy from .env.example) |

---

## 🔧 Environment Variables

### Frontend (/.env.local)
```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Backend (/backend/.env)
```bash
# Required minimum
DATABASE_URL=postgresql://postgres:password@localhost:5432/simplehire
JWT_SECRET=random-32-character-secret-change-this
FRONTEND_URL=http://localhost:5173

# For file uploads (MinIO local)
AWS_ENDPOINT=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_S3_BUCKET=simplehire-dev

# For payments
STRIPE_SECRET_KEY=sk_test_...
```

---

## 🧪 Test Commands

```bash
# Backend health
curl http://localhost:3000/health

# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234!","name":"Test"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234!"}'

# View database
cd backend && npm run prisma:studio
# Opens http://localhost:5555
```

---

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| Backend won't start | Check DATABASE_URL, PostgreSQL running |
| CORS error | FRONTEND_URL in backend .env matches frontend URL |
| 401 Unauthorized | Token expired, logout and login again |
| File upload fails | Start MinIO: `minio server ~/minio-data` |
| Port 3000 in use | `lsof -ti:3000 \| xargs kill -9` |

---

## 📊 What's Implemented

### ✅ Working Now
- User signup/login (JWT)
- User profile
- Product listing
- Stripe payments
- File uploads (S3)
- ID verification workflow
- Reference management
- Certificate generation
- AWS Textract ID extraction
- AWS Rekognition face matching

### ⚠️ Needs Configuration
- Email sending (set SENDGRID_API_KEY)
- Google OAuth (implement in backend)
- AI interview evaluation (set OPENAI_API_KEY)
- MCQ questions (seed database)

---

## 🚢 Deploy in 10 Minutes

### Railway (Easiest)
```bash
# 1. Push to GitHub
git push origin main

# 2. Go to railway.app
# 3. New Project → Deploy from GitHub → Select repo
# 4. Add PostgreSQL
# 5. Set environment variables
# 6. Done!
```

### Vercel (Frontend)
```bash
# Install
npm i -g vercel

# Deploy
vercel

# Set env: VITE_API_BASE_URL=https://your-railway-url/api
```

---

## 📚 Documentation

| Doc | When to Read |
|-----|--------------|
| **INTEGRATION_COMPLETE.md** | Start here! Overview of everything |
| **START_HERE.md** | Navigation guide for all docs |
| **MIGRATION_GUIDE.md** | How to switch from localStorage to backend |
| **COMPLETE_SETUP_GUIDE.md** | Detailed setup instructions |
| **backend/README.md** | Backend-specific guide |
| **DEPLOYMENT_RAILWAY_GCP.md** | Deploy to production |
| **BACKEND_INTEGRATION.md** | Complete API reference |
| **API_INTEGRATION_EXAMPLES.md** | Code examples |

---

## 💰 Costs

### Development
- PostgreSQL: Local (free)
- MinIO: Local (free)
- Stripe: Test mode (free)
- **Total: $0/month**

### Production (Small Scale)
- Railway backend: $5/month
- Vercel frontend: Free
- PostgreSQL on Railway: Included
- S3 storage: ~$2/month
- Stripe: 2.9% + $0.30/transaction
- **Total: ~$7/month + transactions**

### Production (1000 users)
- GCP Cloud Run: ~$10/month
- Cloud SQL: ~$25/month
- Cloud Storage: ~$5/month
- AWS Textract/Rekognition: ~$2/month
- **Total: ~$40-50/month**

---

## 🎯 Success Checklist

- [ ] Backend running locally
- [ ] Frontend running locally
- [ ] Can signup/login
- [ ] Can purchase product
- [ ] Data in PostgreSQL
- [ ] Deployed backend
- [ ] Deployed frontend
- [ ] Works in production

---

## 🆘 Support

**Stuck?**
1. Check this card
2. Read INTEGRATION_COMPLETE.md
3. Read MIGRATION_GUIDE.md
4. Check backend logs: `backend/logs/combined.log`
5. Check database: `npm run prisma:studio`

**Common Issues**: See MIGRATION_GUIDE.md → Debugging section

---

## ⚡ Quick Commands

```bash
# Start everything
cd backend && npm run dev &
cd .. && npm run dev

# View logs
tail -f backend/logs/combined.log

# Database GUI
cd backend && npm run prisma:studio

# Reset database (careful!)
cd backend && npx prisma migrate reset

# Deploy
vercel --prod                    # Frontend
railway up                       # Backend (if using Railway CLI)
```

---

**Keep this card handy! 📌**

Next: Read `INTEGRATION_COMPLETE.md` for full details.

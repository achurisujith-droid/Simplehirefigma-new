# SimplehireAI - Test Accounts Reference

## Quick Login Guide

All test accounts are available on the login screen. Simply click any account to auto-fill the credentials, then click "Sign in".

---

## 🔐 Test User Accounts

### 1️⃣ **John Anderson** (New User - Skill Product Only)
- **Email:** `john@example.com`
- **Password:** `password123`
- **Purchased Products:** Skill Interview only
- **Interview Progress:** Not started
- **Use Case:** Test new user experience with single product purchase

---

### 2️⃣ **Sarah Mitchell** (In Progress - Voice Complete)
- **Email:** `sarah@example.com`
- **Password:** `password123`
- **Purchased Products:** Skill Interview + ID & Visa
- **Interview Progress:** Voice Interview ✅ | MCQ Test ⏳ | Coding ⏳
- **Use Case:** Test resume-from-checkpoint functionality (MCQ Test)

---

### 3️⃣ **Mike Chen** (In Progress - MCQ Complete)
- **Email:** `mike@example.com`
- **Password:** `password123`
- **Purchased Products:** All products (Complete Combo)
- **Interview Progress:** Voice ✅ | MCQ Test ✅ | Coding ⏳
- **Use Case:** Test resume-from-checkpoint (Coding Challenge)

---

### 4️⃣ **Emma Thompson** (Completed - View Certificate)
- **Email:** `emma@example.com`
- **Password:** `password123`
- **Purchased Products:** Skill Interview only
- **Interview Progress:** All steps completed ✅
- **Use Case:** Test certificate view, download PDF, and public URL sharing

---

### 5️⃣ **Alex Rodriguez** (Empty Account)
- **Email:** `alex@example.com`
- **Password:** `password123`
- **Purchased Products:** None
- **Interview Progress:** Not started
- **Use Case:** Test dashboard with no products, purchase flow

---

### 6️⃣ **Demo User** (Full Access Demo)
- **Email:** `demo@simplehire.ai`
- **Password:** `demo`
- **Purchased Products:** All products (Complete Combo)
- **Interview Progress:** Not started (fresh start with all products)
- **Use Case:** Full demo experience with all products unlocked

---

## 🎯 Test Scenarios by Account

### Scenario 1: New User Journey
**Account:** Alex Rodriguez
1. Login with empty account
2. Browse plans on Dashboard
3. Purchase a product (mock payment)
4. Navigate to My Products
5. Start skill verification

### Scenario 2: Resume Interview (Early Stage)
**Account:** Sarah Mitchell
1. Login with voice interview completed
2. Go to My Products
3. Click "Continue verification"
4. Start MCQ Test
5. Complete all steps to certificate

### Scenario 3: Resume Interview (Late Stage)
**Account:** Mike Chen
1. Login with 2 steps complete
2. Go to My Products
3. Click "Continue verification"
4. Jump to Coding Challenge
5. Complete and get certificate

### Scenario 4: Certificate Features
**Account:** Emma Thompson
1. Login with completed verification
2. Go to My Products
3. Click "View Certificate"
4. Test PDF download
5. Copy public verification URL
6. Test LinkedIn/Email sharing

### Scenario 5: Complete Flow
**Account:** John Anderson or Demo User
1. Login with fresh skill product
2. Start skill verification
3. Complete voice interview (6 questions)
4. Take break (optional)
5. Continue to MCQ test (10 questions)
6. Take break (optional)
7. Continue to coding challenge (2 problems)
8. View evaluation
9. Download certificate & share

---

## 📋 Testing Checklist

### Login & Authentication
- [ ] Login with correct credentials works
- [ ] Login with wrong credentials shows error
- [ ] Quick-login buttons auto-fill credentials
- [ ] Google OAuth redirects to app
- [ ] User data persists from localStorage

### Dashboard
- [ ] Empty account shows "No products" message
- [ ] Purchased products display correctly
- [ ] Upgrade card shows for non-combo users
- [ ] Combo users don't see upgrade prompt

### My Products
- [ ] Correct products show based on purchase
- [ ] Interview progress displays accurately
- [ ] Button text changes based on progress:
  - "Start verification" (not started)
  - "Continue verification" (in progress)
  - "View Certificate" (completed)
- [ ] Progress bar shows correct percentage
- [ ] Step indicators show correct states

### Interview Flow
- [ ] Preparation page shows time estimates
- [ ] Voice interview plays 6 React questions
- [ ] MCQ test shows 10 questions with navigator
- [ ] Coding challenge shows 2 React problems
- [ ] Timers count down correctly
- [ ] Progress saves after each step
- [ ] "Take a Break" returns to My Products
- [ ] Resume picks up from last checkpoint

### Certificate
- [ ] Certificate displays with correct scores
- [ ] PDF download generates properly
- [ ] Public URL displays and copies
- [ ] Share buttons work (LinkedIn, Email, Copy)
- [ ] Certificate shows unique ID
- [ ] Skill breakdowns display correctly

### Progress Persistence
- [ ] Voice interview completion saves
- [ ] MCQ test completion saves
- [ ] Coding challenge completion saves
- [ ] Refreshing page keeps progress
- [ ] Different users have separate progress

---

## 🔄 Quick Reset Instructions

To reset a test account's progress:
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Find localStorage
4. Delete the `currentUser` entry
5. Refresh the page
6. Login again with same credentials

The account will reset to its default state as defined in the code.

---

## 💡 Tips for Testing

### Best Testing Order:
1. **Start with Alex** (empty account) - Test purchase flow
2. **Move to John** (single product) - Test full interview flow
3. **Try Sarah** (partial progress) - Test resume functionality
4. **Use Mike** (almost done) - Test coding challenge specifically
5. **Finish with Emma** (completed) - Test certificate features

### Common Issues:
- **Progress not saving:** Check localStorage in DevTools
- **Wrong user data:** Clear localStorage and re-login
- **Certificate not generating:** Ensure all 3 steps are complete
- **PDF download fails:** Check console for errors, refresh page

---

## 🚀 Quick Start for Demos

### 5-Minute Demo (Certificate Focus):
1. Login as **Emma Thompson**
2. Go to My Products → Click "View Certificate"
3. Show PDF download
4. Show public URL sharing
5. Show LinkedIn share option

### 10-Minute Demo (Interview Flow):
1. Login as **Demo User**
2. Go to My Products → Click "Start verification"
3. Complete preparation → Camera check
4. Show 1-2 voice questions (skip rest)
5. Show MCQ test interface (answer a few)
6. Show coding challenge interface
7. Jump to certificate

### Full Demo (30 Minutes):
1. Start with **Alex Rodriguez** (purchase flow)
2. Complete full interview process
3. Generate and download certificate
4. Show all sharing options
5. Demonstrate multiple user accounts

---

## 📊 User Data Summary

| User | Email | Products | Voice | MCQ | Coding | Status |
|------|-------|----------|-------|-----|--------|--------|
| John | john@example.com | 1 | ❌ | ❌ | ❌ | Fresh start |
| Sarah | sarah@example.com | 2 | ✅ | ❌ | ❌ | Early progress |
| Mike | mike@example.com | 3 | ✅ | ✅ | ❌ | Late progress |
| Emma | emma@example.com | 1 | ✅ | ✅ | ✅ | Completed |
| Alex | alex@example.com | 0 | ❌ | ❌ | ❌ | Empty |
| Demo | demo@simplehire.ai | 3 | ❌ | ❌ | ❌ | Full access |

---

## 🎓 Educational Use

These test accounts are perfect for:
- **User Testing:** Get feedback on UX flow
- **Demos:** Show clients/investors the platform
- **Development:** Test new features across different states
- **QA Testing:** Verify bug fixes
- **Training:** Onboard new team members

---

*Last updated: December 26, 2024*
*Test Accounts Version: 1.0*

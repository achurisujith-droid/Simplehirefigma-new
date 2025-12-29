# Simplehire UI Integration Guide

This guide will help you integrate the Simplehire UI into your existing React + Node.js application.

## Prerequisites

- Existing React app (Create React App, Vite, or Next.js)
- Node.js backend with API endpoints
- Git repository

## Step 1: Copy Files to Your Project

### 1.1 Copy Component Files
Copy these folders from this project to your React app:

```
/components/          → your-react-app/src/components/
/styles/              → your-react-app/src/styles/
```

### 1.2 Copy App.tsx (Optional)
You can either:
- **Option A**: Replace your main App file with `/App.tsx`
- **Option B**: Copy the routing logic and integrate it into your existing App file

## Step 2: Install Dependencies

Run these commands in your React app directory:

```bash
npm install lucide-react recharts react-slick react-responsive-masonry
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio
npm install @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label
npm install @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-select
npm install @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-switch
npm install @radix-ui/react-tabs @radix-ui/react-tooltip
npm install sonner@2.0.3
npm install class-variance-authority clsx tailwind-merge
```

## Step 3: Set Up Tailwind CSS v4

### 3.1 Install Tailwind
```bash
npm install tailwindcss@next @tailwindcss/postcss@next
```

### 3.2 Update PostCSS Config
Create or update `postcss.config.js`:

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### 3.3 Use the Existing Styles
The `/styles/globals.css` file already has all the necessary Tailwind setup and custom tokens.

## Step 4: Set Up Routing

### 4.1 Install React Router (if not already installed)
```bash
npm install react-router-dom
```

### 4.2 Update Your App File
Here's how to integrate routing:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

// Import pages
import { LoginPage } from './components/login-page';
import { SignupPage } from './components/signup-page';
import { DashboardPage } from './components/dashboard-page';
import { MyProductsPage } from './components/my-products-page';
import { CertificatesPage } from './components/certificates-page';
import { SkillInterviewPage } from './components/skill-interview-page';
import { IdVerificationPage } from './components/id-verification-page';
import { ReferenceCheckPage } from './components/reference-check-page';
import { TopBar } from './components/top-bar';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : 
          <LoginPage onLogin={() => setIsAuthenticated(true)} onNavigateToSignup={() => {}} />
        } />
        
        <Route path="/signup" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : 
          <SignupPage onSignup={() => setIsAuthenticated(true)} onNavigateToLogin={() => {}} />
        } />

        {/* Protected Routes */}
        <Route path="/" element={
          isAuthenticated ? 
          <div className="min-h-screen bg-slate-50">
            <TopBar activeTab="Dashboard" onNavigate={() => {}} />
            <DashboardPage />
          </div> : 
          <Navigate to="/login" />
        } />

        <Route path="/dashboard" element={
          isAuthenticated ? 
          <div className="min-h-screen bg-slate-50">
            <TopBar activeTab="Dashboard" onNavigate={() => {}} />
            <DashboardPage />
          </div> : 
          <Navigate to="/login" />
        } />

        <Route path="/my-products" element={
          isAuthenticated ? 
          <div className="min-h-screen bg-slate-50">
            <TopBar activeTab="My products" onNavigate={() => {}} />
            <MyProductsPage />
          </div> : 
          <Navigate to="/login" />
        } />

        {/* Add more routes as needed */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

## Step 5: Connect to Your Backend API

### 5.1 Create an API Service
Create `src/services/api.ts`:

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Authentication
export const loginUser = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include', // For cookies
  });
  
  if (!response.ok) throw new Error('Login failed');
  return response.json();
};

export const signupUser = async (name: string, email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
    credentials: 'include',
  });
  
  if (!response.ok) throw new Error('Signup failed');
  return response.json();
};

// Verification Products
export const getUserProducts = async () => {
  const response = await fetch(`${API_BASE_URL}/products`, {
    credentials: 'include',
  });
  
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
};

export const submitIdVerification = async (formData: FormData) => {
  const response = await fetch(`${API_BASE_URL}/verifications/id`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  
  if (!response.ok) throw new Error('Verification submission failed');
  return response.json();
};

export const submitReferences = async (references: any[]) => {
  const response = await fetch(`${API_BASE_URL}/verifications/references`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ references }),
    credentials: 'include',
  });
  
  if (!response.ok) throw new Error('Reference submission failed');
  return response.json();
};

// Add more API calls as needed
```

### 5.2 Update Login Page
Update `/components/login-page.tsx` to use the API:

```tsx
import { loginUser } from '../services/api';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const data = await loginUser(email, password);
    // Store token if using JWT
    localStorage.setItem('token', data.token);
    onLogin();
  } catch (error) {
    console.error('Login failed:', error);
    // Show error message to user
  }
};
```

## Step 6: Update Your Node.js Backend

### 6.1 Create Required API Endpoints

Your Node.js backend should have these endpoints:

```javascript
// Authentication
POST /api/auth/login
POST /api/auth/signup
POST /api/auth/logout
GET  /api/auth/me

// Products/Verifications
GET  /api/products
POST /api/products/purchase

// ID Verification
POST /api/verifications/id
GET  /api/verifications/id/:id

// Skill Interview
POST /api/verifications/skill
GET  /api/verifications/skill/:id

// References
POST /api/verifications/references
GET  /api/verifications/references/:id

// Certificates
GET  /api/certificates
GET  /api/certificates/:id/download
```

### 6.2 Example Express Route Structure

```javascript
// routes/auth.js
const express = require('express');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Your authentication logic
  // Validate credentials, create session/JWT
  
  res.json({ 
    success: true, 
    token: 'your-jwt-token',
    user: { id, email, name }
  });
});

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  
  // Your signup logic
  // Create user, hash password, etc.
  
  res.json({ 
    success: true, 
    token: 'your-jwt-token',
    user: { id, email, name }
  });
});

module.exports = router;
```

## Step 7: Environment Variables

### 7.1 Frontend (.env)
Create `.env` in your React app:

```
REACT_APP_API_URL=http://localhost:3001/api
```

### 7.2 Backend (.env)
Update your Node.js backend `.env`:

```
PORT=3001
DATABASE_URL=your-database-url
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
```

## Step 8: CORS Configuration

Update your Node.js backend to allow requests from your React app:

```javascript
// server.js or app.js
const cors = require('cors');

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
```

## Step 9: File Upload Handling

For document uploads (ID, Visa, etc.), set up file upload middleware:

```bash
npm install multer
```

```javascript
// middleware/upload.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'));
    }
  }
});

module.exports = upload;
```

## Step 10: Testing the Integration

1. Start your Node.js backend:
   ```bash
   npm run dev  # or your start command
   ```

2. Start your React app:
   ```bash
   npm start
   ```

3. Test the flow:
   - Navigate to `/login`
   - Sign up or log in
   - Test each verification flow
   - Verify API calls in Network tab

## Common Issues & Solutions

### Issue: CORS errors
**Solution**: Make sure CORS is properly configured in your Node.js backend with `credentials: true`

### Issue: Authentication not persisting
**Solution**: Use `credentials: 'include'` in all fetch requests and ensure cookies are set with proper domain

### Issue: Tailwind styles not working
**Solution**: Make sure you're using Tailwind v4 and have imported `/styles/globals.css` in your main file

### Issue: Components not found
**Solution**: Check that all component paths are correct relative to your project structure

## Additional Resources

- [React Router Documentation](https://reactrouter.com/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [ShadCN UI Components](https://ui.shadcn.com/)

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check Network tab for failed API calls
3. Verify all dependencies are installed
4. Ensure environment variables are set correctly

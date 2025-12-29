# API Integration Examples

Complete code examples for integrating the Simplehire frontend with your backend API.

## Table of Contents
1. [Setup](#setup)
2. [Authentication Examples](#authentication-examples)
3. [User Profile Examples](#user-profile-examples)
4. [Skill Interview Examples](#skill-interview-examples)
5. [ID Verification Examples](#id-verification-examples)
6. [Reference Check Examples](#reference-check-examples)
7. [Payment Examples](#payment-examples)
8. [Error Handling](#error-handling)

---

## Setup

### 1. Import Services

```typescript
import { authService } from './services/auth.service';
import { userService } from './services/user.service';
import { interviewService } from './services/interview.service';
import { idVerificationService } from './services/id-verification.service';
import { referenceService } from './services/reference.service';
import { paymentService } from './services/payment.service';
import { certificateService } from './services/certificate.service';
```

### 2. Configure API Client

```typescript
// src/config/environment.ts
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  // ... other config
};
```

---

## Authentication Examples

### Login

```typescript
import { authService } from './services/auth.service';
import { toast } from 'sonner';

async function handleLogin(email: string, password: string) {
  try {
    const response = await authService.login(email, password);
    
    if (response.success && response.data) {
      // Store user data
      setCurrentUser(response.data.user);
      setIsAuthenticated(true);
      
      // Token is automatically stored by apiClient
      toast.success('Login successful!');
      
      // Navigate to dashboard
      navigate('/dashboard');
    } else {
      toast.error(response.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    toast.error('Unable to connect to server');
  }
}
```

### Signup

```typescript
async function handleSignup(email: string, password: string, name: string) {
  try {
    const response = await authService.signup(email, password, name);
    
    if (response.success && response.data) {
      setCurrentUser(response.data.user);
      setIsAuthenticated(true);
      
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } else {
      if (response.error?.includes('already exists')) {
        toast.error('Email already registered');
      } else {
        toast.error(response.error || 'Signup failed');
      }
    }
  } catch (error) {
    console.error('Signup error:', error);
    toast.error('Unable to create account');
  }
}
```

### Google OAuth

```typescript
import { GoogleLogin } from '@react-oauth/google';

function GoogleAuthButton() {
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await authService.loginWithGoogle(
        credentialResponse.credential
      );
      
      if (response.success && response.data) {
        setCurrentUser(response.data.user);
        setIsAuthenticated(true);
        toast.success('Logged in with Google!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Google login failed');
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => toast.error('Google login failed')}
    />
  );
}
```

### Logout

```typescript
async function handleLogout() {
  try {
    await authService.logout();
    
    // Clear local state
    setIsAuthenticated(false);
    setCurrentUser(null);
    setPurchasedProducts([]);
    
    toast.success('Logged out successfully');
    navigate('/login');
  } catch (error) {
    // Even if API call fails, clear local state
    setIsAuthenticated(false);
    navigate('/login');
  }
}
```

### Token Refresh

```typescript
async function refreshAuthToken() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }
    
    const response = await authService.refreshToken(refreshToken);
    
    if (response.success && response.data) {
      // New token automatically stored by apiClient
      return true;
    }
    
    // If refresh fails, logout user
    handleLogout();
    return false;
  } catch (error) {
    handleLogout();
    return false;
  }
}
```

---

## User Profile Examples

### Load User Data on App Start

```typescript
useEffect(() => {
  async function loadUserData() {
    try {
      const response = await userService.getUserData();
      
      if (response.success && response.data) {
        setCurrentUser({
          id: response.data.id,
          email: response.data.email,
          name: response.data.name,
        });
        setPurchasedProducts(response.data.purchasedProducts);
        setInterviewProgress(response.data.interviewProgress);
        setIdVerificationStatus(response.data.idVerificationStatus);
        setReferenceCheckStatus(response.data.referenceCheckStatus);
        setReferences(response.data.references);
        setIsAuthenticated(true);
      } else {
        // Token invalid, logout
        handleLogout();
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      handleLogout();
    }
  }

  const token = localStorage.getItem('authToken');
  if (token) {
    loadUserData();
  }
}, []);
```

### Update User Profile

```typescript
async function updateProfile(name: string) {
  try {
    const response = await userService.updateProfile({ name });
    
    if (response.success && response.data) {
      setCurrentUser(response.data);
      toast.success('Profile updated successfully');
    } else {
      toast.error('Failed to update profile');
    }
  } catch (error) {
    toast.error('Unable to update profile');
  }
}
```

### Sync Progress to Backend

```typescript
// Sync interview progress
async function syncInterviewProgress(progress: InterviewProgress) {
  try {
    await userService.updateInterviewProgress(progress);
  } catch (error) {
    console.error('Failed to sync progress:', error);
  }
}

// Call after each step completion
const handleVoiceInterviewComplete = async () => {
  const newProgress = { ...interviewProgress, voiceInterview: true };
  setInterviewProgress(newProgress);
  await syncInterviewProgress(newProgress);
};
```

---

## Skill Interview Examples

### Upload Resume

```typescript
async function handleResumeUpload(file: File) {
  try {
    setIsUploading(true);
    
    const response = await interviewService.uploadDocuments(file);
    
    if (response.success && response.data) {
      toast.success('Resume uploaded successfully');
      setInterviewProgress({ ...interviewProgress, documentsUploaded: true });
      return response.data.resumeUrl;
    } else {
      toast.error('Failed to upload resume');
      return null;
    }
  } catch (error) {
    toast.error('Upload failed');
    return null;
  } finally {
    setIsUploading(false);
  }
}
```

### Start Voice Interview

```typescript
async function startVoiceInterview(role: string) {
  try {
    setIsLoading(true);
    
    const response = await interviewService.startVoiceInterview(role);
    
    if (response.success && response.data) {
      setSessionId(response.data.sessionId);
      setQuestions(response.data.questions);
      setCurrentPage('InterviewLive');
    } else {
      toast.error('Failed to start interview');
    }
  } catch (error) {
    toast.error('Unable to start interview');
  } finally {
    setIsLoading(false);
  }
}
```

### Submit Voice Recording

```typescript
async function submitVoiceInterview(audioBlob: Blob, sessionId: string) {
  try {
    setIsSubmitting(true);
    
    const response = await interviewService.submitVoiceInterview(
      sessionId,
      audioBlob
    );
    
    if (response.success) {
      toast.success('Interview submitted successfully');
      setInterviewProgress({ ...interviewProgress, voiceInterview: true });
      setCurrentPage('InterviewStepComplete');
    } else {
      toast.error('Failed to submit interview');
    }
  } catch (error) {
    toast.error('Submission failed');
  } finally {
    setIsSubmitting(false);
  }
}
```

### Load MCQ Questions

```typescript
async function loadMCQQuestions(role: string) {
  try {
    setIsLoading(true);
    
    const response = await interviewService.getMCQQuestions(role);
    
    if (response.success && response.data) {
      setQuestions(response.data);
    } else {
      toast.error('Failed to load questions');
    }
  } catch (error) {
    toast.error('Unable to load questions');
  } finally {
    setIsLoading(false);
  }
}
```

### Submit MCQ Test

```typescript
async function submitMCQTest(answers: Record<string, number>) {
  try {
    setIsSubmitting(true);
    
    const response = await interviewService.submitMCQTest(answers);
    
    if (response.success && response.data) {
      toast.success(`Score: ${response.data.score}/${response.data.totalQuestions}`);
      setInterviewProgress({ ...interviewProgress, mcqTest: true });
      setCurrentPage('InterviewStepComplete');
    } else {
      toast.error('Failed to submit test');
    }
  } catch (error) {
    toast.error('Submission failed');
  } finally {
    setIsSubmitting(false);
  }
}
```

### Load Coding Challenge

```typescript
async function loadCodingChallenge(role: string) {
  try {
    setIsLoading(true);
    
    const response = await interviewService.getCodingChallenge(role);
    
    if (response.success && response.data) {
      setChallenge(response.data);
      setCode(response.data.starterCode);
    } else {
      toast.error('Failed to load challenge');
    }
  } catch (error) {
    toast.error('Unable to load challenge');
  } finally {
    setIsLoading(false);
  }
}
```

### Submit Coding Solution

```typescript
async function submitCodingSolution(
  challengeId: string,
  code: string,
  language: string
) {
  try {
    setIsSubmitting(true);
    
    const response = await interviewService.submitCodingChallenge(
      challengeId,
      code,
      language
    );
    
    if (response.success && response.data) {
      if (response.data.passed) {
        toast.success('All test cases passed!');
        setInterviewProgress({ ...interviewProgress, codingChallenge: true });
        setCurrentPage('InterviewEval');
      } else {
        toast.error('Some test cases failed');
        setTestResults(response.data.testResults);
      }
    } else {
      toast.error('Submission failed');
    }
  } catch (error) {
    toast.error('Unable to submit solution');
  } finally {
    setIsSubmitting(false);
  }
}
```

### Get Evaluation Results

```typescript
async function loadEvaluationResults() {
  try {
    setIsLoading(true);
    
    const response = await interviewService.getEvaluationResults();
    
    if (response.success && response.data) {
      setSkillAssessments(response.data);
    } else {
      toast.error('Failed to load results');
    }
  } catch (error) {
    toast.error('Unable to load results');
  } finally {
    setIsLoading(false);
  }
}
```

### Generate Certificate

```typescript
async function generateCertificate() {
  try {
    setIsGenerating(true);
    
    const response = await interviewService.generateCertificate();
    
    if (response.success && response.data) {
      toast.success('Certificate generated!');
      setCertificateId(response.data.certificateId);
      setCurrentPage('InterviewCert');
    } else {
      toast.error('Failed to generate certificate');
    }
  } catch (error) {
    toast.error('Unable to generate certificate');
  } finally {
    setIsGenerating(false);
  }
}
```

---

## ID Verification Examples

### Upload ID Document

```typescript
async function handleIdUpload(file: File, documentType: string) {
  try {
    setIsUploading(true);
    
    const response = await idVerificationService.uploadIdDocument(
      file,
      documentType as 'passport' | 'drivers-license' | 'national-id'
    );
    
    if (response.success && response.data) {
      setIdDocumentUrl(response.data.documentUrl);
      toast.success('ID document uploaded');
    } else {
      toast.error('Upload failed');
    }
  } catch (error) {
    toast.error('Unable to upload document');
  } finally {
    setIsUploading(false);
  }
}
```

### Upload Visa Document

```typescript
async function handleVisaUpload(file: File, documentType: string) {
  try {
    setIsUploading(true);
    
    const response = await idVerificationService.uploadVisaDocument(
      file,
      documentType as 'visa' | 'ead' | 'green-card'
    );
    
    if (response.success && response.data) {
      setVisaDocumentUrl(response.data.documentUrl);
      toast.success('Visa document uploaded');
    } else {
      toast.error('Upload failed');
    }
  } catch (error) {
    toast.error('Unable to upload document');
  } finally {
    setIsUploading(false);
  }
}
```

### Capture and Upload Selfie

```typescript
async function captureSelfie(videoRef: HTMLVideoElement) {
  try {
    // Capture frame from video
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.videoWidth;
    canvas.height = videoRef.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef, 0, 0);
    
    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95);
    });
    
    // Upload to backend
    setIsUploading(true);
    const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
    
    const response = await idVerificationService.uploadSelfie(file);
    
    if (response.success && response.data) {
      setSelfieUrl(response.data.selfieUrl);
      toast.success('Selfie captured');
    } else {
      toast.error('Upload failed');
    }
  } catch (error) {
    toast.error('Failed to capture selfie');
  } finally {
    setIsUploading(false);
  }
}
```

### Submit Verification

```typescript
async function submitVerification() {
  try {
    if (!idDocumentUrl || !selfieUrl) {
      toast.error('Please upload all required documents');
      return;
    }
    
    setIsSubmitting(true);
    
    const response = await idVerificationService.submitVerification({
      idDocumentUrl,
      visaDocumentUrl,
      selfieUrl,
    });
    
    if (response.success && response.data) {
      toast.success('Verification submitted for review');
      setIdVerificationStatus('pending');
      setCurrentPage('IdSubmitted');
    } else {
      toast.error('Submission failed');
    }
  } catch (error) {
    toast.error('Unable to submit verification');
  } finally {
    setIsSubmitting(false);
  }
}
```

### Check Verification Status

```typescript
async function checkVerificationStatus() {
  try {
    const response = await idVerificationService.getVerificationStatus();
    
    if (response.success && response.data) {
      setIdVerificationStatus(response.data.status);
      
      if (response.data.status === 'verified') {
        toast.success('ID verification complete!');
      } else if (response.data.status === 'pending') {
        toast.info('Verification in progress');
      }
    }
  } catch (error) {
    console.error('Failed to check status:', error);
  }
}

// Poll for status updates
useEffect(() => {
  if (idVerificationStatus === 'pending') {
    const interval = setInterval(() => {
      checkVerificationStatus();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }
}, [idVerificationStatus]);
```

---

## Reference Check Examples

### Add Reference

```typescript
async function handleAddReference(referenceData: Omit<ReferenceItem, 'id' | 'status'>) {
  try {
    setIsSubmitting(true);
    
    const response = await referenceService.addReference(referenceData);
    
    if (response.success && response.data) {
      setReferences([...references, response.data]);
      toast.success('Reference added');
      return response.data;
    } else {
      toast.error('Failed to add reference');
      return null;
    }
  } catch (error) {
    toast.error('Unable to add reference');
    return null;
  } finally {
    setIsSubmitting(false);
  }
}
```

### Update Reference

```typescript
async function handleUpdateReference(
  referenceId: string,
  updates: Partial<ReferenceItem>
) {
  try {
    const response = await referenceService.updateReference(referenceId, updates);
    
    if (response.success && response.data) {
      setReferences(references.map(ref => 
        ref.id === referenceId ? response.data : ref
      ));
      toast.success('Reference updated');
    } else {
      toast.error('Update failed');
    }
  } catch (error) {
    toast.error('Unable to update reference');
  }
}
```

### Delete Reference

```typescript
async function handleDeleteReference(referenceId: string) {
  try {
    const response = await referenceService.deleteReference(referenceId);
    
    if (response.success) {
      setReferences(references.filter(ref => ref.id !== referenceId));
      toast.success('Reference deleted');
    } else {
      toast.error('Delete failed');
    }
  } catch (error) {
    toast.error('Unable to delete reference');
  }
}
```

### Submit References

```typescript
async function submitReferences(referenceIds: string[]) {
  try {
    setIsSubmitting(true);
    
    const response = await referenceService.submitReferences(referenceIds);
    
    if (response.success && response.data) {
      toast.success(`${response.data.emailsSent} reference requests sent`);
      
      // Update statuses
      setReferences(references.map(ref =>
        referenceIds.includes(ref.id)
          ? { ...ref, status: 'email-sent' as ReferenceStatus }
          : ref
      ));
      
      setReferenceCheckStatus('in-progress');
      setCurrentPage('ReferenceSubmitted');
    } else {
      toast.error('Failed to send emails');
    }
  } catch (error) {
    toast.error('Unable to submit references');
  } finally {
    setIsSubmitting(false);
  }
}
```

### Get Reference Summary

```typescript
async function loadReferenceSummary() {
  try {
    const response = await referenceService.getReferenceSummary();
    
    if (response.success && response.data) {
      setSummary(response.data);
    }
  } catch (error) {
    console.error('Failed to load summary:', error);
  }
}
```

---

## Payment Examples

### Load Products

```typescript
async function loadProducts() {
  try {
    setIsLoading(true);
    
    const response = await paymentService.getProducts();
    
    if (response.success && response.data) {
      setProducts(response.data);
    } else {
      toast.error('Failed to load products');
    }
  } catch (error) {
    toast.error('Unable to load products');
  } finally {
    setIsLoading(false);
  }
}
```

### Process Payment (Stripe)

```typescript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function PaymentForm({ productId }: { productId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!stripe || !elements) return;
    
    try {
      setIsProcessing(true);
      
      // Create payment intent
      const intentResponse = await paymentService.createPaymentIntent(productId);
      
      if (!intentResponse.success || !intentResponse.data) {
        toast.error('Failed to initialize payment');
        return;
      }
      
      const { clientSecret, paymentIntentId } = intentResponse.data;
      
      // Confirm payment
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement)!,
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      // Confirm with backend
      const confirmResponse = await paymentService.confirmPayment(
        paymentIntentId,
        paymentMethod!.id
      );
      
      if (confirmResponse.success && confirmResponse.data?.success) {
        toast.success('Payment successful!');
        
        // Add product to purchased list
        const product = confirmResponse.data.purchasedProduct;
        if (product === 'combo') {
          setPurchasedProducts(['skill', 'id-visa', 'reference']);
        } else {
          setPurchasedProducts([...purchasedProducts, product]);
        }
        
        setCurrentPage('My products');
      } else {
        toast.error('Payment failed');
      }
    } catch (error) {
      toast.error('Payment processing error');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={isProcessing || !stripe}>
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

// Wrap with Stripe Elements provider
function PaymentPage({ productId }: { productId: string }) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm productId={productId} />
    </Elements>
  );
}
```

---

## Error Handling

### Global Error Handler

```typescript
import { toast } from 'sonner';

function handleApiError(error: any, fallbackMessage: string = 'An error occurred') {
  if (error?.code) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        toast.error('Please log in to continue');
        // Redirect to login
        window.location.href = '/login';
        break;
      
      case 'FORBIDDEN':
        toast.error('You don\'t have permission to do this');
        break;
      
      case 'NOT_FOUND':
        toast.error('Resource not found');
        break;
      
      case 'VALIDATION_ERROR':
        toast.error(error.message || 'Please check your input');
        break;
      
      case 'RATE_LIMIT_EXCEEDED':
        toast.error('Too many requests. Please try again later');
        break;
      
      case 'TIMEOUT':
        toast.error('Request timeout. Please check your connection');
        break;
      
      default:
        toast.error(error.message || fallbackMessage);
    }
  } else if (error?.message) {
    toast.error(error.message);
  } else {
    toast.error(fallbackMessage);
  }
}

// Usage
try {
  const response = await authService.login(email, password);
  // ...
} catch (error) {
  handleApiError(error, 'Login failed');
}
```

### Retry Logic

```typescript
async function retryRequest<T>(
  requestFn: () => Promise<ApiResponse<T>>,
  maxRetries: number = 3
): Promise<ApiResponse<T>> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await requestFn();
      if (response.success) {
        return response;
      }
      lastError = response.error;
    } catch (error) {
      lastError = error;
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  
  throw lastError;
}

// Usage
const response = await retryRequest(
  () => userService.getUserData()
);
```

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**For**: Simplehire Backend Integration

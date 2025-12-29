import { ReferenceItem } from "./components/reference-status-card";
import { useState, lazy, Suspense, useEffect } from "react";
import { DashboardPage } from "./components/dashboard-page";
import { MyProductsPage } from "./components/my-products-page";
import { PaymentPage } from "./components/payment-page";
import { InterviewDocumentUploadPage } from "./components/interview-document-upload-page";
import { InterviewPreparationPage } from "./components/interview-preparation-page";
import { InterviewLivePage } from "./components/interview-live-page";
import { StepCompletionPage } from "./components/step-completion-page";
import { McqTestPage } from "./components/mcq-test-page";
import { CodingChallengePage } from "./components/coding-challenge-page";
import { InterviewEvaluationPage } from "./components/interview-evaluation-page";
import { InterviewCertificatePage } from "./components/interview-certificate-page";
import { PublicCertificateView } from "./components/public-certificate-view";
import { LoginPage } from "./components/login-page";
import { SignupPage } from "./components/signup-page";
import { TopBar } from "./components/top-bar";

// Import services
import { useAuth } from "./hooks/useAuth";
import { userService } from "./services/user.service";
import { paymentService } from "./services/payment.service";
import { referenceService } from "./services/reference.service";

// Lazy load heavy pages
const IdVerificationPage = lazy(() => import("./components/id-verification-page").then(m => ({ default: m.IdVerificationPage })));
const VerificationSubmittedPage = lazy(() => import("./components/verification-submitted-page").then(m => ({ default: m.VerificationSubmittedPage })));
const ReferenceCheckPage = lazy(() => import("./components/reference-check-page").then(m => ({ default: m.ReferenceCheckPage })));
const ReferenceSubmittedPage = lazy(() => import("./components/reference-submitted-page").then(m => ({ default: m.ReferenceSubmittedPage })));
const CertificatesPage = lazy(() => import("./components/certificates-page").then(m => ({ default: m.CertificatesPage })));

type InterviewProgress = {
  documentsUploaded: boolean;
  voiceInterview: boolean;
  mcqTest: boolean;
  codingChallenge: boolean;
};

type VerificationStatus = "not-started" | "in-progress" | "pending" | "verified";

export default function App() {
  // Use auth hook instead of local state
  const { isAuthenticated, user, isLoading: authLoading, login, signup, logout, refreshUser } = useAuth();
  
  const [purchasedProducts, setPurchasedProducts] = useState<string[]>([]);
  const [interviewProgress, setInterviewProgress] = useState<InterviewProgress>({
    documentsUploaded: false,
    voiceInterview: false,
    mcqTest: false,
    codingChallenge: false,
  });
  const [idVerificationStatus, setIdVerificationStatus] = useState<VerificationStatus>("not-started");
  const [referenceCheckStatus, setReferenceCheckStatus] = useState<VerificationStatus>("not-started");
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [authPage, setAuthPage] = useState<"login" | "signup">("login");
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    name: string;
    price: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState<"Dashboard" | "My products" | "Certificates" | "Help" | "InterviewDocUpload" | "InterviewPrep" | "InterviewLive" | "InterviewStepComplete" | "McqTest" | "CodingChallenge" | "InterviewEval" | "InterviewCert" | "IdVerification" | "IdSubmitted" | "ReferenceCheck" | "ReferenceSubmitted">("Dashboard");

  // Fetch user data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserData();
    }
  }, [isAuthenticated, user]);

  const fetchUserData = async () => {
    try {
      const response = await userService.getUserData();
      if (response.success && response.data) {
        setPurchasedProducts(response.data.purchasedProducts || []);
        setInterviewProgress(response.data.interviewProgress || {
          documentsUploaded: false,
          voiceInterview: false,
          mcqTest: false,
          codingChallenge: false,
        });
        setIdVerificationStatus(response.data.idVerificationStatus || "not-started");
        setReferenceCheckStatus(response.data.referenceCheckStatus || "not-started");
        setReferences(response.data.references || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleLogin = async (credentials: { email: string; password: string }) => {
    const result = await login(credentials.email, credentials.password);
    if (result.success) {
      setCurrentPage("Dashboard");
    }
    return result;
  };

  const handleSignup = async (data: { email: string; password: string; name: string }) => {
    const result = await signup(data.email, data.password, data.name);
    if (result.success) {
      setCurrentPage("Dashboard");
    }
    return result;
  };

  const handleLogout = async () => {
    await logout();
    setPurchasedProducts([]);
    setInterviewProgress({
      documentsUploaded: false,
      voiceInterview: false,
      mcqTest: false,
      codingChallenge: false,
    });
    setIdVerificationStatus("not-started");
    setReferenceCheckStatus("not-started");
    setReferences([]);
    setSelectedPlan(null);
    setCurrentPage("Dashboard");
    setAuthPage("login");
  };

  const handlePaymentSuccess = async (productId: string) => {
    // Payment already confirmed by backend, just update local state
    if (productId === "combo") {
      setPurchasedProducts(["skill", "id-visa", "reference"]);
    } else if (!purchasedProducts.includes(productId)) {
      setPurchasedProducts([...purchasedProducts, productId]);
    }
    
    // Refresh user data from backend
    await refreshUser();
    await fetchUserData();
    
    setSelectedPlan(null);
    setCurrentPage("My products");
  };

  const handleVoiceInterviewComplete = async () => {
    const newProgress = { ...interviewProgress, voiceInterview: true };
    setInterviewProgress(newProgress);
    
    // Update backend
    await userService.updateInterviewProgress(newProgress);
    
    setCurrentPage("InterviewStepComplete");
  };

  const handleMcqTestComplete = async () => {
    const newProgress = { ...interviewProgress, mcqTest: true };
    setInterviewProgress(newProgress);
    
    // Update backend
    await userService.updateInterviewProgress(newProgress);
    
    setCurrentPage("InterviewStepComplete");
  };

  const handleCodingChallengeComplete = async () => {
    const newProgress = { ...interviewProgress, codingChallenge: true };
    setInterviewProgress(newProgress);
    
    // Update backend
    await userService.updateInterviewProgress(newProgress);
    
    setCurrentPage("InterviewEval");
  };

  const handleDocumentsUploaded = async () => {
    const newProgress = { ...interviewProgress, documentsUploaded: true };
    setInterviewProgress(newProgress);
    
    // Update backend
    await userService.updateInterviewProgress(newProgress);
    
    setCurrentPage("InterviewStepComplete");
  };

  const handleIdVerificationSubmit = async () => {
    setIdVerificationStatus("pending");
    
    // Update backend
    await userService.updateIdVerificationStatus("pending");
    
    setCurrentPage("IdSubmitted");
  };

  const handleReferenceSubmit = async (submittedReferences: ReferenceItem[]) => {
    setReferences(submittedReferences);
    setReferenceCheckStatus("in-progress");
    
    // Submit to backend
    const referenceIds = submittedReferences.map(ref => ref.id);
    await referenceService.submitReferences(referenceIds);
    await userService.updateReferenceCheckStatus("in-progress");
    
    setCurrentPage("ReferenceSubmitted");
  };

  const getCurrentStepNumber = () => {
    if (!interviewProgress.documentsUploaded) return 0;
    if (!interviewProgress.voiceInterview) return 1;
    if (!interviewProgress.mcqTest) return 2;
    if (!interviewProgress.codingChallenge) return 3;
    return 4;
  };

  const getCurrentStepName = () => {
    const step = getCurrentStepNumber();
    if (step === 0) return "Not Started";
    if (step === 1) return "Upload Documents";
    if (step === 2) return "Voice Interview";
    if (step === 3) return "MCQ Test";
    return "Coding Challenge";
  };

  const handleContinueAfterStep = () => {
    if (!interviewProgress.documentsUploaded) {
      setCurrentPage("InterviewPrep");
    } else if (!interviewProgress.voiceInterview) {
      setCurrentPage("InterviewLive");
    } else if (!interviewProgress.mcqTest) {
      setCurrentPage("McqTest");
    } else if (!interviewProgress.codingChallenge) {
      setCurrentPage("CodingChallenge");
    } else {
      setCurrentPage("InterviewEval");
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle login/signup
  if (!isAuthenticated) {
    if (authPage === "login") {
      return (
        <LoginPage
          onLogin={async (email, password) => {
            const result = await handleLogin({ email, password });
            if (!result.success) {
              throw new Error(result.error || 'Login failed');
            }
          }}
          onNavigateToSignup={() => setAuthPage("signup")}
        />
      );
    } else {
      return (
        <SignupPage
          onSignup={async (name, email, password) => {
            const result = await handleSignup({ email, password, name });
            if (!result.success) {
              throw new Error(result.error || 'Signup failed');
            }
          }}
          onNavigateToLogin={() => setAuthPage("login")}
        />
      );
    }
  }

  // Show payment page after plan selection
  if (isAuthenticated && selectedPlan) {
    return (
      <PaymentPage
        selectedPlan={selectedPlan}
        onPaymentSuccess={() => handlePaymentSuccess(selectedPlan.id)}
        onBack={() => setSelectedPlan(null)}
      />
    );
  }

  // Main application pages
  return (
    <div className="min-h-screen bg-neutral-50">
      <TopBar
        userName={user?.name || "User"}
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page as any)}
        onLogout={handleLogout}
      />

      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-neutral-600">Loading...</p>
          </div>
        </div>
      }>
        {currentPage === "Dashboard" && (
          <DashboardPage
            onNavigateToProducts={() => setCurrentPage("My products")}
            onSelectPlan={setSelectedPlan}
            purchasedProducts={purchasedProducts}
            interviewProgress={interviewProgress}
            idVerificationStatus={idVerificationStatus}
            referenceCheckStatus={referenceCheckStatus}
          />
        )}

        {currentPage === "My products" && (
          <MyProductsPage
            purchasedProducts={purchasedProducts}
            onSelectPlan={setSelectedPlan}
            onStartInterview={() => setCurrentPage("InterviewPrep")}
            onStartIdVerification={() => setCurrentPage("IdVerification")}
            onStartReferenceCheck={() => setCurrentPage("ReferenceCheck")}
            interviewProgress={interviewProgress}
            idVerificationStatus={idVerificationStatus}
            referenceCheckStatus={referenceCheckStatus}
            onContinueInterview={() => handleContinueAfterStep()}
            onViewIdStatus={() => setCurrentPage("IdSubmitted")}
            onViewReferenceStatus={() => setCurrentPage("ReferenceSubmitted")}
            onViewCertificate={() => setCurrentPage("InterviewCert")}
          />
        )}

        {currentPage === "Certificates" && <CertificatesPage />}

        {currentPage === "InterviewPrep" && (
          <InterviewPreparationPage
            onContinue={() => setCurrentPage("InterviewDocUpload")}
            onBack={() => setCurrentPage("My products")}
          />
        )}

        {currentPage === "InterviewDocUpload" && (
          <InterviewDocumentUploadPage
            onContinue={handleDocumentsUploaded}
            onBack={() => setCurrentPage("InterviewPrep")}
          />
        )}

        {currentPage === "InterviewLive" && (
          <InterviewLivePage
            onComplete={handleVoiceInterviewComplete}
            onBack={() => setCurrentPage("My products")}
          />
        )}

        {currentPage === "McqTest" && (
          <McqTestPage
            onComplete={handleMcqTestComplete}
            onBack={() => setCurrentPage("My products")}
          />
        )}

        {currentPage === "CodingChallenge" && (
          <CodingChallengePage
            onComplete={handleCodingChallengeComplete}
            onBack={() => setCurrentPage("My products")}
          />
        )}

        {currentPage === "InterviewStepComplete" && (
          <StepCompletionPage
            stepNumber={getCurrentStepNumber()}
            stepName={getCurrentStepName()}
            onContinue={handleContinueAfterStep}
            onBackToDashboard={() => setCurrentPage("My products")}
          />
        )}

        {currentPage === "InterviewEval" && (
          <InterviewEvaluationPage
            onContinue={() => setCurrentPage("InterviewCert")}
            onBackToDashboard={() => setCurrentPage("My products")}
          />
        )}

        {currentPage === "InterviewCert" && (
          <InterviewCertificatePage
            candidateName={user?.name || "Candidate"}
            onBackToDashboard={() => setCurrentPage("Dashboard")}
          />
        )}

        {currentPage === "IdVerification" && (
          <IdVerificationPage
            onSubmit={handleIdVerificationSubmit}
            onBack={() => setCurrentPage("My products")}
          />
        )}

        {currentPage === "IdSubmitted" && (
          <VerificationSubmittedPage
            status={idVerificationStatus}
            onBackToDashboard={() => setCurrentPage("Dashboard")}
          />
        )}

        {currentPage === "ReferenceCheck" && (
          <ReferenceCheckPage
            initialReferences={references}
            onSubmit={handleReferenceSubmit}
            onBack={() => setCurrentPage("My products")}
          />
        )}

        {currentPage === "ReferenceSubmitted" && (
          <ReferenceSubmittedPage
            references={references}
            onBackToDashboard={() => setCurrentPage("Dashboard")}
          />
        )}

        {currentPage === "Help" && (
          <div className="container mx-auto px-4 py-8">
            <h1>Help Center</h1>
            <p>Contact support@simplehire.ai</p>
          </div>
        )}
      </Suspense>
    </div>
  );
}

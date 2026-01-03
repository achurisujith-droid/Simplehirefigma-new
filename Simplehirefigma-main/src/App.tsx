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
import { useAuthStore } from "./src/store/authStore";
import { userService } from "./src/services/user.service";
import { toast } from "sonner@2.0.3";

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

type UserData = {
  purchasedProducts: string[];
  interviewProgress: InterviewProgress;
  idVerificationStatus: VerificationStatus;
  referenceCheckStatus: VerificationStatus;
  references: ReferenceItem[];
};

export default function App() {
  // Auth state from store
  const { isAuthenticated, user, isLoading: authLoading, bootstrap, logout: authLogout } = useAuthStore();
  
  // User data state (fetched from backend)
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // UI state
  const [authPage, setAuthPage] = useState<"login" | "signup">("login");
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    name: string;
    price: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState<"Dashboard" | "My products" | "Certificates" | "Help" | "InterviewDocUpload" | "InterviewPrep" | "InterviewLive" | "InterviewStepComplete" | "McqTest" | "CodingChallenge" | "InterviewEval" | "InterviewCert" | "IdVerification" | "IdSubmitted" | "ReferenceCheck" | "ReferenceSubmitted">("Dashboard");
  const [showSessionExpired, setShowSessionExpired] = useState(false);

  // Bootstrap authentication on mount
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Listen for session expired event
  useEffect(() => {
    const handleSessionExpired = () => {
      setShowSessionExpired(true);
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, []);

  // Fetch user data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserData();
    } else {
      setUserData(null);
    }
  }, [isAuthenticated, user]);

  const fetchUserData = async () => {
    try {
      setIsLoadingData(true);
      const response = await userService.getUserData();
      
      if (response.success && response.data) {
        setUserData({
          purchasedProducts: response.data.purchasedProducts || [],
          interviewProgress: response.data.interviewProgress || {
            documentsUploaded: false,
            voiceInterview: false,
            mcqTest: false,
            codingChallenge: false,
          },
          idVerificationStatus: response.data.idVerificationStatus || "not-started",
          referenceCheckStatus: response.data.referenceCheckStatus || "not-started",
          references: response.data.references || [],
        });
        
        // Navigate to appropriate page based on products
        const products = response.data.purchasedProducts ?? [];
        if (products.length > 0) {
          setCurrentPage("My products");
        } else {
          setCurrentPage("Dashboard");
        }
      } else {
        toast.error("Failed to load user data", {
          description: response.error || "Please try again",
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogout = async () => {
    await authLogout();
    setUserData(null);
    setSelectedPlan(null);
    setCurrentPage("Dashboard");
    setAuthPage("login");
  };

  // Loading state
  if (authLoading || (isAuthenticated && isLoadingData)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle login/signup
  if (!isAuthenticated) {
    if (authPage === "login") {
      return (
        <LoginPage
          onLogin={() => {
            // Auth store handles login, just navigate
            setAuthPage("login");
          }}
          onNavigateToSignup={() => setAuthPage("signup")}
        />
      );
    } else {
      return (
        <SignupPage
          onSignup={() => {
            // Auth store handles signup, just navigate
            setAuthPage("login");
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
        onPaymentSuccess={async () => {
          // Payment successful - refetch user data from backend
          await fetchUserData();
          setSelectedPlan(null);
          setCurrentPage("My products");
          toast.success("Purchase successful!", {
            description: "Your verification has been activated.",
          });
        }}
        onBack={() => setSelectedPlan(null)}
      />
    );
  }

  // Helper functions for interview flow
  const handleVoiceInterviewComplete = async () => {
    const newProgress = { ...userData!.interviewProgress, voiceInterview: true };
    setUserData({ ...userData!, interviewProgress: newProgress });
    await userService.updateInterviewProgress(newProgress);
    setCurrentPage("InterviewStepComplete");
  };

  const handleMcqTestComplete = async () => {
    const newProgress = { ...userData!.interviewProgress, mcqTest: true };
    setUserData({ ...userData!, interviewProgress: newProgress });
    await userService.updateInterviewProgress(newProgress);
    setCurrentPage("InterviewStepComplete");
  };

  const handleCodingChallengeComplete = async () => {
    const newProgress = { ...userData!.interviewProgress, codingChallenge: true };
    setUserData({ ...userData!, interviewProgress: newProgress });
    await userService.updateInterviewProgress(newProgress);
    setCurrentPage("InterviewEval");
  };

  const getCurrentStepNumber = () => {
    // Returns the step that was just completed
    if (!userData?.interviewProgress.documentsUploaded) return 0; // Not started
    if (!userData?.interviewProgress.voiceInterview) return 1; // Docs completed
    if (!userData?.interviewProgress.mcqTest) return 2; // Voice completed
    if (!userData?.interviewProgress.codingChallenge) return 3; // MCQ completed
    return 4; // All completed
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
    if (!userData?.interviewProgress.documentsUploaded) {
      setCurrentPage("InterviewPrep");
    } else if (!userData?.interviewProgress.voiceInterview) {
      setCurrentPage("InterviewLive");
    } else if (!userData?.interviewProgress.mcqTest) {
      setCurrentPage("McqTest");
    } else if (!userData?.interviewProgress.codingChallenge) {
      setCurrentPage("CodingChallenge");
    } else {
      setCurrentPage("InterviewEval");
    }
  };

  const handleTakeBreak = () => {
    setCurrentPage("My products");
  };

  const handleStartOrContinueInterview = () => {
    // Check where the user left off and resume from there
    if (!userData?.interviewProgress.documentsUploaded) {
      setCurrentPage("InterviewDocUpload");
    } else if (!userData?.interviewProgress.voiceInterview) {
      setCurrentPage("InterviewPrep");
    } else if (!userData?.interviewProgress.mcqTest) {
      setCurrentPage("McqTest");
    } else if (!userData?.interviewProgress.codingChallenge) {
      setCurrentPage("CodingChallenge");
    } else {
      setCurrentPage("InterviewCert");
    }
  };

  const renderPage = () => {
    // Guard - ensure userData is loaded
    if (!userData) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-600">Loading user data...</p>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case "Dashboard":
        return <DashboardPage 
          onSelectPlan={(plan) => setSelectedPlan(plan)}
          purchasedProducts={userData.purchasedProducts}
          interviewProgress={userData.interviewProgress}
          idVerificationStatus={userData.idVerificationStatus}
          referenceCheckStatus={userData.referenceCheckStatus}
          references={userData.references}
          onStartInterview={handleStartOrContinueInterview}
          onStartIdVerification={() => setCurrentPage("IdVerification")}
          onStartReferenceCheck={() => setCurrentPage("ReferenceCheck")}
          onViewCertificate={(productId) => {
            if (productId === 'skill') {
              setCurrentPage("InterviewCert");
            }
          }}
        />;
      case "My products":
        // If user has no products, redirect to Dashboard to see pricing plans
        if (!userData.purchasedProducts || userData.purchasedProducts.length === 0) {
          setCurrentPage("Dashboard");
          return <DashboardPage 
            onSelectPlan={(plan) => setSelectedPlan(plan)}
            purchasedProducts={userData.purchasedProducts}
            interviewProgress={userData.interviewProgress}
            idVerificationStatus={userData.idVerificationStatus}
            referenceCheckStatus={userData.referenceCheckStatus}
            references={userData.references}
            onStartInterview={handleStartOrContinueInterview}
            onStartIdVerification={() => setCurrentPage("IdVerification")}
            onStartReferenceCheck={() => setCurrentPage("ReferenceCheck")}
            onViewCertificate={(productId) => {
              if (productId === 'skill') {
                setCurrentPage("InterviewCert");
              }
            }}
          />;
        }
        return <MyProductsPage 
          purchasedProducts={userData.purchasedProducts}
          interviewProgress={userData.interviewProgress}
          idVerificationStatus={userData.idVerificationStatus}
          referenceCheckStatus={userData.referenceCheckStatus}
          references={userData.references}
          onStartInterview={handleStartOrContinueInterview}
          onStartIdVerification={() => setCurrentPage("IdVerification")}
          onStartReferenceCheck={() => setCurrentPage("ReferenceCheck")}
          onUpgrade={() => setCurrentPage("Dashboard")}
        />;
      case "Certificates":
        return (
          <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <CertificatesPage />
          </Suspense>
        );
      case "InterviewDocUpload":
        return (
          <InterviewDocumentUploadPage 
            onComplete={async () => {
              const newProgress = { ...userData.interviewProgress, documentsUploaded: true };
              setUserData({ ...userData, interviewProgress: newProgress });
              await userService.updateInterviewProgress(newProgress);
              setCurrentPage("InterviewPrep");
            }}
          />
        );
      case "InterviewPrep":
        return (
          <InterviewPreparationPage 
            onStartInterview={() => setCurrentPage("InterviewLive")}
            onBack={() => setCurrentPage("My products")}
          />
        );
      case "InterviewLive":
        return (
          <InterviewLivePage 
            onComplete={handleVoiceInterviewComplete}
          />
        );
      case "InterviewStepComplete":
        return (
          <StepCompletionPage
            stepNumber={getCurrentStepNumber()}
            stepName={getCurrentStepName()}
            onContinue={handleContinueAfterStep}
            onTakeBreak={handleTakeBreak}
          />
        );
      case "McqTest":
        return (
          <McqTestPage 
            onComplete={handleMcqTestComplete}
          />
        );
      case "CodingChallenge":
        return (
          <CodingChallengePage 
            onComplete={handleCodingChallengeComplete}
          />
        );
      case "InterviewEval":
        return (
          <InterviewEvaluationPage 
            onComplete={() => setCurrentPage("InterviewCert")}
          />
        );
      case "InterviewCert":
        return (
          <InterviewCertificatePage 
            onBackToProducts={() => {
              setCurrentPage("My products");
            }}
            purchasedProducts={userData.purchasedProducts}
            skillVerified={userData.interviewProgress.voiceInterview && userData.interviewProgress.mcqTest && userData.interviewProgress.codingChallenge}
            idVerified={userData.idVerificationStatus === "verified"}
            referenceVerified={userData.referenceCheckStatus === "verified"}
          />
        );
      case "IdVerification":
        return (
          <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <IdVerificationPage 
              verificationStatus={userData.idVerificationStatus}
              onSubmit={async () => {
                // Update verification status to pending
                setUserData({ ...userData, idVerificationStatus: "pending" });
                await userService.updateIdVerificationStatus("pending");
                setCurrentPage("IdSubmitted");
              }} 
            />
          </Suspense>
        );
      case "IdSubmitted":
        return (
          <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <VerificationSubmittedPage onBackToDashboard={() => setCurrentPage("My products")} />
          </Suspense>
        );
      case "ReferenceCheck":
        return (
          <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <ReferenceCheckPage 
              existingReferences={userData.references}
              onSubmitReferences={async (submittedReferences) => {
                // Update references with email-sent status
                const referencesWithEmailSent = submittedReferences.map(ref => ({
                  ...ref,
                  status: "email-sent" as const,
                  emailSentDate: new Date().toISOString()
                }));
                
                setUserData({ 
                  ...userData, 
                  references: referencesWithEmailSent,
                  referenceCheckStatus: "pending"
                });
                
                // TODO: Call backend API to submit references
                await userService.updateReferenceCheckStatus("pending");
                
                setCurrentPage("ReferenceSubmitted");
              }} 
            />
          </Suspense>
        );
      case "ReferenceSubmitted":
        return (
          <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <ReferenceSubmittedPage onBackToDashboard={() => setCurrentPage("My products")} />
          </Suspense>
        );
      default:
        return <DashboardPage 
          onSelectPlan={(plan) => setSelectedPlan(plan)}
          purchasedProducts={userData.purchasedProducts}
          interviewProgress={userData.interviewProgress}
          idVerificationStatus={userData.idVerificationStatus}
          referenceCheckStatus={userData.referenceCheckStatus}
          references={userData.references}
          onStartInterview={handleStartOrContinueInterview}
          onStartIdVerification={() => setCurrentPage("IdVerification")}
          onStartReferenceCheck={() => setCurrentPage("ReferenceCheck")}
        />;
    }
  };

  const getActiveTab = () => {
    if (["InterviewPrep", "InterviewLive", "InterviewStepComplete", "McqTest", "CodingChallenge", "InterviewEval", "InterviewCert", "IdVerification", "IdSubmitted", "ReferenceCheck", "ReferenceSubmitted"].includes(currentPage)) {
      return "My products";
    }
    if (currentPage === "Certificates") {
      return "Certificates";
    }
    return currentPage as "Dashboard" | "My products" | "Certificates" | "Help";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hide TopBar during live interview and evaluation for immersive experience */}
      {!["InterviewLive", "McqTest", "CodingChallenge", "InterviewEval"].includes(currentPage) && (
        <TopBar 
          activeTab={getActiveTab()} 
          onNavigate={setCurrentPage}
          onLogout={handleLogout}
          userEmail={user?.email}
          userName={user?.name}
        />
      )}
      {renderPage()}
      
      {/* Session Expired Modal */}
      {showSessionExpired && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-2">Session Expired</h2>
            <p className="text-gray-600 mb-4">
              Your session has expired. Please log in again to continue.
            </p>
            <button
              onClick={() => {
                setShowSessionExpired(false);
                handleLogout();
                setAuthPage('login');
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Log In Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
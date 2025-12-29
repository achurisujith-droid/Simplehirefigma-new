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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; id: string } | null>(null);
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

  // Check localStorage on mount for existing session
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setCurrentUser({ email: userData.email, name: userData.name, id: userData.id });
        setPurchasedProducts(userData.purchasedProducts || []);
        setInterviewProgress(userData.interviewProgress || {
          documentsUploaded: false,
          voiceInterview: false,
          mcqTest: false,
          codingChallenge: false,
        });
        setIdVerificationStatus(userData.idVerificationStatus || "not-started");
        setReferenceCheckStatus(userData.referenceCheckStatus || "not-started");
        // Load submitted references or draft references (whichever is more recent)
        setReferences(userData.references || userData.draftReferences || []);
        setIsAuthenticated(true);
        
        // Navigate based on purchased products
        if (userData.purchasedProducts && userData.purchasedProducts.length > 0) {
          // User has purchased products, skip to My Products
          setCurrentPage("My products");
        } else {
          // User has no products, show Dashboard (plans page)
          setCurrentPage("Dashboard");
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  // Save state to localStorage whenever key data changes
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const userData = {
        email: currentUser.email,
        name: currentUser.name,
        id: currentUser.id,
        purchasedProducts,
        interviewProgress,
        idVerificationStatus,
        referenceCheckStatus,
        references,
      };
      localStorage.setItem('currentUser', JSON.stringify(userData));
    }
  }, [isAuthenticated, currentUser, purchasedProducts, interviewProgress, idVerificationStatus, referenceCheckStatus, references]);

  const handleLogin = (user: { email: string; name: string; id: string }) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    
    // Load user's data from localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setPurchasedProducts(userData.purchasedProducts || []);
        setInterviewProgress(userData.interviewProgress || {
          documentsUploaded: false,
          voiceInterview: false,
          mcqTest: false,
          codingChallenge: false,
        });
        setIdVerificationStatus(userData.idVerificationStatus || "not-started");
        setReferenceCheckStatus(userData.referenceCheckStatus || "not-started");
        setReferences(userData.references || []);
        
        // Navigate based on purchased products
        if (userData.purchasedProducts && userData.purchasedProducts.length > 0) {
          // User has purchased products, skip to My Products
          setCurrentPage("My products");
        } else {
          // User has no products, show Dashboard (plans page)
          setCurrentPage("Dashboard");
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setCurrentPage("Dashboard");
      }
    } else {
      // No stored data, show Dashboard
      setCurrentPage("Dashboard");
    }
  };

  const handleSignup = (user: { email: string; name: string; id: string }) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentPage("Dashboard");
    
    // Save to localStorage
    localStorage.setItem('currentUser', JSON.stringify({
      ...user,
      purchasedProducts: [],
      interviewProgress: {
        documentsUploaded: false,
        voiceInterview: false,
        mcqTest: false,
        codingChallenge: false,
      },
      idVerificationStatus: "not-started",
      referenceCheckStatus: "not-started",
      references: [],
    }));
  };

  const handleLogout = () => {
    // Clear all user data
    setIsAuthenticated(false);
    setCurrentUser(null);
    setPurchasedProducts([]);
    setInterviewProgress({
      documentsUploaded: false,
      voiceInterview: false,
      mcqTest: false,
      codingChallenge: false,
    });
    setIdVerificationStatus("not-started");
    setReferenceCheckStatus("not-started");
    setSelectedPlan(null);
    setCurrentPage("Dashboard");
    setAuthPage("login");
    
    // Clear localStorage
    localStorage.removeItem('currentUser');
  };

  // Handle login/signup
  if (!isAuthenticated) {
    if (authPage === "login") {
      return (
        <LoginPage
          onLogin={handleLogin}
          onNavigateToSignup={() => setAuthPage("signup")}
        />
      );
    } else {
      return (
        <SignupPage
          onSignup={handleSignup}
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
        onPaymentSuccess={() => {
          // Add the purchased product to the list
          if (selectedPlan.id === "combo") {
            // If combo is purchased, add all three products
            setPurchasedProducts(["skill", "id-visa", "reference"]);
          } else if (!purchasedProducts.includes(selectedPlan.id)) {
            // Add individual product if not already purchased
            setPurchasedProducts([...purchasedProducts, selectedPlan.id]);
          }
          setSelectedPlan(null);
          setCurrentPage("My products");
        }}
        onBack={() => setSelectedPlan(null)}
      />
    );
  }

  const handleVoiceInterviewComplete = () => {
    setInterviewProgress({ ...interviewProgress, voiceInterview: true });
    setCurrentPage("InterviewStepComplete");
  };

  const handleMcqTestComplete = () => {
    setInterviewProgress({ ...interviewProgress, mcqTest: true });
    setCurrentPage("InterviewStepComplete");
  };

  const handleCodingChallengeComplete = () => {
    setInterviewProgress({ ...interviewProgress, codingChallenge: true });
    setCurrentPage("InterviewEval");
  };

  const getCurrentStepNumber = () => {
    // Returns the step that was just completed
    if (!interviewProgress.documentsUploaded) return 0; // Not started
    if (!interviewProgress.voiceInterview) return 1; // Docs completed
    if (!interviewProgress.mcqTest) return 2; // Voice completed
    if (!interviewProgress.codingChallenge) return 3; // MCQ completed
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
    if (!interviewProgress.documentsUploaded) {
      // This shouldn't happen
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

  const handleTakeBreak = () => {
    setCurrentPage("My products");
  };

  const handleStartOrContinueInterview = () => {
    // Check where the user left off and resume from there
    if (!interviewProgress.documentsUploaded) {
      // Start from document upload
      setCurrentPage("InterviewDocUpload");
    } else if (!interviewProgress.voiceInterview) {
      // Resume at voice interview prep
      setCurrentPage("InterviewPrep");
    } else if (!interviewProgress.mcqTest) {
      // Resume at MCQ test
      setCurrentPage("McqTest");
    } else if (!interviewProgress.codingChallenge) {
      // Resume at coding challenge
      setCurrentPage("CodingChallenge");
    } else {
      // All complete, show certificate
      setCurrentPage("InterviewCert");
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case "Dashboard":
        return <DashboardPage 
          onSelectPlan={(plan) => setSelectedPlan(plan)}
          purchasedProducts={purchasedProducts}
          interviewProgress={interviewProgress}
          idVerificationStatus={idVerificationStatus}
          referenceCheckStatus={referenceCheckStatus}
          references={references}
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
        return <MyProductsPage 
          purchasedProducts={purchasedProducts}
          interviewProgress={interviewProgress}
          idVerificationStatus={idVerificationStatus}
          referenceCheckStatus={referenceCheckStatus}
          references={references}
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
            onComplete={() => {
              setInterviewProgress({ ...interviewProgress, documentsUploaded: true });
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
              // Don't reset progress - certificate is earned permanently
              setCurrentPage("My products");
            }}
            purchasedProducts={purchasedProducts}
            skillVerified={interviewProgress.voiceInterview && interviewProgress.mcqTest && interviewProgress.codingChallenge}
            idVerified={idVerificationStatus === "verified"}
            referenceVerified={referenceCheckStatus === "verified"}
          />
        );
      case "IdVerification":
        return (
          <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <IdVerificationPage 
              verificationStatus={idVerificationStatus}
              onSubmit={() => {
                // Update verification status to pending (waiting for review)
                setIdVerificationStatus("pending");
                
                // Update localStorage
                const storedUser = localStorage.getItem('currentUser');
                if (storedUser) {
                  const userData = JSON.parse(storedUser);
                  userData.idVerificationStatus = "pending";
                  localStorage.setItem('currentUser', JSON.stringify(userData));
                }
                
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
              existingReferences={references}
              onSubmitReferences={(submittedReferences) => {
                // Simulate sending emails - update status for each reference
                const referencesWithEmailSent = submittedReferences.map(ref => ({
                  ...ref,
                  status: "email-sent" as const,
                  emailSentDate: new Date().toISOString()
                }));
                
                setReferences(referencesWithEmailSent);
                setReferenceCheckStatus("pending");
                
                // Update localStorage
                const storedUser = localStorage.getItem('currentUser');
                if (storedUser) {
                  const userData = JSON.parse(storedUser);
                  userData.referenceCheckStatus = "pending";
                  userData.references = referencesWithEmailSent;
                  localStorage.setItem('currentUser', JSON.stringify(userData));
                }
                
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
        return <DashboardPage />;
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
          userEmail={currentUser?.email}
          userName={currentUser?.name}
        />
      )}
      {renderPage()}
    </div>
  );
}
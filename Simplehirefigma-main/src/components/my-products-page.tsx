import { ProductStatusCard } from "./product-status-card";
import { CompletionHelperPanel } from "./completion-helper-panel";
import { ReferenceStatusCard, ReferenceItem } from "./reference-status-card";
import { Sparkles, ArrowRight } from "lucide-react";

interface MyProductsPageProps {
  purchasedProducts: string[];
  interviewProgress?: {
    documentsUploaded?: boolean;
    voiceInterview: boolean;
    mcqTest: boolean;
    codingChallenge: boolean;
  };
  idVerificationStatus?: "not-started" | "in-progress" | "pending" | "verified";
  referenceCheckStatus?: "not-started" | "in-progress" | "pending" | "verified";
  references?: ReferenceItem[];
  onStartInterview?: () => void;
  onStartIdVerification?: () => void;
  onStartReferenceCheck?: () => void;
  onUpgrade?: () => void;
}

export function MyProductsPage({ 
  purchasedProducts, 
  interviewProgress, 
  idVerificationStatus = "not-started",
  referenceCheckStatus = "not-started",
  references = [],
  onStartInterview, 
  onStartIdVerification, 
  onStartReferenceCheck, 
  onUpgrade 
}: MyProductsPageProps) {
  // Calculate statistics from real reference data
  const refereeCount = references.length;
  const responsesReceived = references.filter(ref => 
    ref.status === "response-received" || ref.status === "verified"
  ).length;
  const pendingCount = references.filter(ref => 
    ref.status === "pending" || ref.status === "email-sent"
  ).length;

  const allProducts = [
    {
      id: "skill",
      title: "Skill verification",
      statusLabel: "Included in your plan",
      description: "AI-powered interview validates your professional skills",
      status: interviewProgress?.voiceInterview && interviewProgress?.mcqTest && interviewProgress?.codingChallenge 
        ? "Complete" 
        : interviewProgress?.voiceInterview || interviewProgress?.mcqTest || interviewProgress?.codingChallenge
        ? "In progress"
        : "Waiting on you",
      statusColor: (interviewProgress?.voiceInterview && interviewProgress?.mcqTest && interviewProgress?.codingChallenge 
        ? "green" 
        : interviewProgress?.voiceInterview || interviewProgress?.mcqTest || interviewProgress?.codingChallenge
        ? "blue"
        : "amber") as const,
      steps: [
        { 
          label: "Voice Interview", 
          completed: interviewProgress?.voiceInterview || false, 
          current: !interviewProgress?.voiceInterview 
        },
        { 
          label: "MCQ Test", 
          completed: interviewProgress?.mcqTest || false, 
          current: interviewProgress?.voiceInterview && !interviewProgress?.mcqTest 
        },
        { 
          label: "Coding Challenge", 
          completed: interviewProgress?.codingChallenge || false, 
          current: interviewProgress?.mcqTest && !interviewProgress?.codingChallenge 
        },
        { 
          label: "Certificate ready", 
          completed: interviewProgress?.voiceInterview && interviewProgress?.mcqTest && interviewProgress?.codingChallenge || false,
          current: false
        }
      ],
      buttonText: interviewProgress?.voiceInterview && interviewProgress?.mcqTest && interviewProgress?.codingChallenge
        ? "View Certificate"
        : interviewProgress?.voiceInterview || interviewProgress?.mcqTest || interviewProgress?.codingChallenge
        ? "Continue verification"
        : "Start verification",
      buttonVariant: "primary" as const,
      lastActivity: interviewProgress?.codingChallenge 
        ? "Coding challenge completed"
        : interviewProgress?.mcqTest
        ? "MCQ test completed"
        : interviewProgress?.voiceInterview 
        ? "Voice interview completed" 
        : "Not started",
      nextAction: interviewProgress?.voiceInterview && interviewProgress?.mcqTest && interviewProgress?.codingChallenge
        ? "Your certificate is ready to view"
        : interviewProgress?.mcqTest
        ? "Complete coding challenge"
        : interviewProgress?.voiceInterview
        ? "Take MCQ test"
        : "Start with voice interview",
      details: [],
      onButtonClick: onStartInterview
    },
    {
      id: "id-visa",
      title: "ID + Visa verification",
      statusLabel: "Included in your plan",
      description: "Validate government ID and work authorization documents",
      status: idVerificationStatus === "verified" 
        ? "Complete" 
        : idVerificationStatus === "pending"
        ? "In review"
        : idVerificationStatus === "in-progress" 
        ? "In progress" 
        : "Waiting on you",
      statusColor: idVerificationStatus === "verified" 
        ? "green" 
        : idVerificationStatus === "pending"
        ? "purple"
        : idVerificationStatus === "in-progress" 
        ? "blue" 
        : "amber" as const,
      steps: [
        { label: "Upload ID", completed: idVerificationStatus === "verified" || idVerificationStatus === "pending" || idVerificationStatus === "in-progress", current: idVerificationStatus === "not-started" },
        { label: "Upload visa/EAD", completed: idVerificationStatus === "verified" || idVerificationStatus === "pending" || idVerificationStatus === "in-progress" },
        { label: "Face match", completed: idVerificationStatus === "verified" || idVerificationStatus === "pending" || idVerificationStatus === "in-progress" },
        { label: "Review complete", completed: idVerificationStatus === "verified" }
      ],
      buttonText: idVerificationStatus === "verified" 
        ? "View Certificate" 
        : idVerificationStatus === "pending"
        ? "Verification in review"
        : idVerificationStatus === "in-progress" 
        ? "Continue verification" 
        : "Start verification",
      buttonVariant: idVerificationStatus === "verified" 
        ? "primary" 
        : idVerificationStatus === "pending"
        ? "secondary"
        : "primary" as const,
      lastActivity: idVerificationStatus === "verified" 
        ? "ID and visa verified" 
        : idVerificationStatus === "pending"
        ? "Documents submitted and under review"
        : idVerificationStatus === "in-progress" 
        ? "ID document uploaded on 20 May" 
        : "Not started",
      nextAction: idVerificationStatus === "verified" 
        ? "Your certificate is ready to view" 
        : idVerificationStatus === "pending"
        ? "Your documents are being verified (1-2 business days)"
        : idVerificationStatus === "in-progress" 
        ? "Upload work authorization document (visa or EAD)" 
        : "Start with ID upload",
      details: [],
      onButtonClick: idVerificationStatus === "pending" ? undefined : onStartIdVerification
    },
    {
      id: "reference",
      title: "Reference check",
      statusLabel: "Included in your plan",
      description: "Automated collection and verification of professional references",
      status: referenceCheckStatus === "verified" 
        ? "Complete" 
        : references.some(ref => ref.status === "email-sent" || ref.status === "response-received" || ref.status === "verified")
        ? "Waiting on others"
        : references.length > 0
        ? "In progress"
        : "Not started",
      statusColor: referenceCheckStatus === "verified" 
        ? "green" 
        : references.some(ref => ref.status === "email-sent" || ref.status === "response-received" || ref.status === "verified")
        ? "purple"
        : references.length > 0
        ? "blue"
        : "amber" as const,
      steps: [
        { label: "Add referees", completed: references.length > 0, current: references.length === 0 },
        { label: "Emails sent", completed: references.some(ref => ref.status === "email-sent" || ref.status === "response-received" || ref.status === "verified") },
        { label: "Responses received", completed: references.some(ref => ref.status === "response-received" || ref.status === "verified") },
        { label: "Summary ready", completed: references.length > 0 && references.every(ref => ref.status === "verified") }
      ],
      buttonText: referenceCheckStatus === "verified" 
        ? "View Certificate" 
        : references.length > 0
        ? "Continue reference check"
        : "Start reference check",
      buttonVariant: referenceCheckStatus === "verified" ? "primary" : "secondary" as const,
      lastActivity: references.length === 0
        ? "Not started"
        : references.some(ref => ref.responseDate)
        ? `Response received ${formatDate(references.filter(ref => ref.responseDate).sort((a, b) => new Date(b.responseDate!).getTime() - new Date(a.responseDate!).getTime())[0].responseDate!)}`
        : references.some(ref => ref.emailSentDate)
        ? `Email sent ${formatDate(references.filter(ref => ref.emailSentDate).sort((a, b) => new Date(b.emailSentDate!).getTime() - new Date(a.emailSentDate!).getTime())[0].emailSentDate!)}`
        : "References added",
      nextAction: referenceCheckStatus === "verified" 
        ? "Your certificate is ready to view" 
        : pendingCount > 0 && references.some(ref => ref.status === "email-sent" || ref.status === "response-received")
        ? `Waiting for ${pendingCount} reference response${pendingCount > 1 ? 's' : ''}`
        : references.length > 0 && !references.some(ref => ref.status === "email-sent")
        ? `Submit ${references.length} reference${references.length > 1 ? 's' : ''} for verification`
        : "Start with adding referees",
      details: references.length > 0 ? [
        { label: `${refereeCount} referee${refereeCount !== 1 ? 's' : ''} added`, icon: "users" as const },
        { label: `${responsesReceived} response${responsesReceived !== 1 ? 's' : ''} received`, icon: "check" as const },
        { label: `${pendingCount} pending`, icon: "clock" as const }
      ] : [],
      onButtonClick: onStartReferenceCheck,
      // Add individual reference details for expanded view
      individualReferences: references.map(ref => ({
        name: ref.name,
        company: ref.company,
        email: ref.email,
        status: ref.status,
        statusLabel: ref.status === "verified" 
          ? "Verified" 
          : ref.status === "response-received"
          ? "Response received"
          : ref.status === "email-sent"
          ? "Email sent"
          : "Pending submission",
        statusColor: ref.status === "verified"
          ? "green"
          : ref.status === "response-received"
          ? "blue"
          : ref.status === "email-sent"
          ? "purple"
          : "amber",
        date: ref.status === "verified" || ref.status === "response-received"
          ? ref.responseDate
          : ref.status === "email-sent"
          ? ref.emailSentDate
          : undefined
      }))
    }
  ];

  // Helper function to format dates
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "yesterday";
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Filter products based on what user has purchased
  const products = allProducts.filter(product => purchasedProducts.includes(product.id));

  // Check if user has all products (complete combo)
  const hasAllProducts = purchasedProducts.length === 3;
  
  // Calculate progress based on actual completion of all purchased products
  const calculateProgress = () => {
    if (purchasedProducts.length === 0) return 0;
    
    let totalSteps = 0;
    let completedSteps = 0;
    
    // Count steps for skill verification if purchased
    if (purchasedProducts.includes('skill')) {
      totalSteps += 4; // Voice, MCQ, Coding, Certificate
      if (interviewProgress?.voiceInterview) completedSteps++;
      if (interviewProgress?.mcqTest) completedSteps++;
      if (interviewProgress?.codingChallenge) completedSteps++;
      if (interviewProgress?.voiceInterview && interviewProgress?.mcqTest && interviewProgress?.codingChallenge) {
        completedSteps++; // Certificate ready
      }
    }
    
    // Count steps for ID verification if purchased
    if (purchasedProducts.includes('id-visa')) {
      totalSteps += 4;
      if (idVerificationStatus !== "not-started") completedSteps++;
      if (idVerificationStatus === "pending" || idVerificationStatus === "verified") completedSteps += 2;
      if (idVerificationStatus === "verified") completedSteps++;
    }
    
    // Count steps for reference check if purchased - using REAL reference data
    if (purchasedProducts.includes('reference')) {
      totalSteps += 4;
      
      // Step 1: Add referees (at least 1 reference added)
      if (references.length > 0) completedSteps++;
      
      // Step 2: Emails sent (any reference has email-sent status or beyond)
      const anyEmailSent = references.some(ref => 
        ref.status === "email-sent" || 
        ref.status === "response-received" || 
        ref.status === "verified"
      );
      if (anyEmailSent) completedSteps++;
      
      // Step 3: Responses received (any reference has response-received or verified)
      const anyResponseReceived = references.some(ref => 
        ref.status === "response-received" || 
        ref.status === "verified"
      );
      if (anyResponseReceived) completedSteps++;
      
      // Step 4: All verified
      const allVerified = references.length > 0 && references.every(ref => ref.status === "verified");
      if (allVerified) completedSteps++;
    }
    
    return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  };
  
  const progressPercentage = calculateProgress();

  return (
    <main className="max-w-[1440px] mx-auto px-8 py-12">
      <div className="flex gap-8">
        {/* Main content area */}
        <div className="flex-1">
          {/* Page header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h1 className="text-slate-900 mb-2">My products</h1>
                <p className="text-slate-600">
                  Track the progress of your verification products.
                </p>
              </div>
              {purchasedProducts.length > 0 && (
                <div className="ml-8">
                  <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 min-w-[280px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Overall verification progress</span>
                      <span className="text-sm text-slate-900">{progressPercentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* No products message */}
          {purchasedProducts.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-slate-900 mb-2">No products yet</h3>
                <p className="text-slate-600 mb-6">
                  Get started by purchasing a verification plan to unlock your professional credentials.
                </p>
                <button
                  onClick={onUpgrade}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  Browse Plans
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Product status cards */}
          {products.length > 0 && (
            <div className="space-y-6">
              {products.map((product) => (
                <ProductStatusCard key={product.id} {...product} />
              ))}
            </div>
          )}
        </div>

        {/* Right side panel */}
        {purchasedProducts.length > 0 && (
          <CompletionHelperPanel 
            purchasedProducts={purchasedProducts}
            interviewProgress={interviewProgress}
            idVerificationStatus={idVerificationStatus}
            referenceCheckStatus={referenceCheckStatus}
            references={references}
          />
        )}
      </div>
    </main>
  );
}
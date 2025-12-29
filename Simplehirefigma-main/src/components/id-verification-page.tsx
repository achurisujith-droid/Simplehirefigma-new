import { Badge } from "./ui/badge";
import { ProgressStepper } from "./progress-stepper";
import { UploadIdStep } from "./upload-id-step";
import { UploadVisaStep } from "./upload-visa-step";
import { SelfieStep } from "./selfie-step";
import { ReviewSubmitStep } from "./review-submit-step";
import { VerificationStatusPanel } from "./verification-status-panel";
import { TipsPanel } from "./tips-panel";
import { VisaExplanationCard } from "./visa-explanation-card";
import { Lock } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

interface IdVerificationPageProps {
  verificationStatus?: "not-started" | "in-progress" | "pending" | "verified";
  onSubmit: () => void;
}

export function IdVerificationPage({ verificationStatus = "not-started", onSubmit }: IdVerificationPageProps) {
  const [currentStep, setCurrentStep] = useState(1); // Start from step 1

  // If already submitted, show read-only status view
  if (verificationStatus === "pending" || verificationStatus === "verified") {
    return (
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Page header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-slate-900 mb-2">ID + Visa verification</h1>
              <p className="text-slate-600 text-sm md:text-base">
                {verificationStatus === "verified" 
                  ? "Your identity and work authorization have been successfully verified!"
                  : "Your documents are currently being reviewed by our team."}
              </p>
            </div>
            <Badge className={verificationStatus === "verified" ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"}>
              {verificationStatus === "verified" ? "✓ Verified" : "⏳ Under review"}
            </Badge>
          </div>
        </div>

        {/* Status card */}
        <div className="max-w-2xl mx-auto">
          <div className={`bg-white rounded-xl border-2 ${verificationStatus === "verified" ? "border-green-200" : "border-amber-200"} shadow-sm p-8`}>
            <div className={`w-20 h-20 ${verificationStatus === "verified" ? "bg-green-100" : "bg-amber-100"} rounded-full flex items-center justify-center mx-auto mb-6`}>
              <Lock className={`w-10 h-10 ${verificationStatus === "verified" ? "text-green-600" : "text-amber-600"}`} />
            </div>
            
            <h2 className="text-slate-900 text-center mb-2">
              {verificationStatus === "verified" 
                ? "Verification Complete" 
                : "Verification In Progress"}
            </h2>
            
            <p className="text-center text-slate-600 mb-6">
              {verificationStatus === "verified"
                ? "Your identity and work authorization documents have been verified. You can now share your verified status with employers."
                : "We're reviewing your documents. This typically takes 24-48 hours. We'll send you an email once the review is complete."}
            </p>

            {verificationStatus === "pending" && (
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
                <p className="text-sm text-blue-900"><strong>What's being reviewed:</strong></p>
                <ul className="mt-2 space-y-2 text-sm text-blue-900">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    Government-issued ID document
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    Work authorization status
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    Selfie verification
                  </li>
                </ul>
              </div>
            )}

            <div className="text-center">
              <Button 
                onClick={() => window.history.back()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Back to dashboard
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const steps = [
    { label: "Upload ID document", completed: currentStep > 1, current: currentStep === 1 },
    { label: "Upload Visa / EAD", completed: currentStep > 2, current: currentStep === 2 },
    { label: "Selfie capture", completed: currentStep > 3, current: currentStep === 3 },
    { label: "Review & submit", completed: currentStep > 4, current: currentStep === 4 }
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <UploadIdStep onContinue={() => setCurrentStep(2)} />;
      case 2:
        return <UploadVisaStep onBack={() => setCurrentStep(1)} onContinue={() => setCurrentStep(3)} />;
      case 3:
        return <SelfieStep onBack={() => setCurrentStep(2)} onContinue={() => setCurrentStep(4)} />;
      case 4:
        return <ReviewSubmitStep onBack={() => setCurrentStep(3)} onSubmit={onSubmit} />;
      default:
        return <UploadIdStep onContinue={() => setCurrentStep(2)} />;
    }
  };

  return (
    <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-12">
      {/* Page header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-slate-900 mb-2">ID + Visa verification</h1>
            <p className="text-slate-600 text-sm md:text-base">
              Verify your identity and work authorization to complete your Simplehire profile.
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 self-start">
            In progress
          </Badge>
        </div>

        {/* Progress stepper */}
        <ProgressStepper steps={steps} />
      </div>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Left column - Step content */}
        <div className="flex-1">
          {renderStep()}
        </div>

        {/* Right column - Status and help */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
          {currentStep === 2 ? (
            <>
              <VisaExplanationCard />
            </>
          ) : (
            <>
              <VerificationStatusPanel currentStep={currentStep} />
              <TipsPanel />
            </>
          )}
        </div>
      </div>

      {/* Bottom info bar */}
      <div className="mt-6 md:mt-8 bg-slate-50 rounded-lg border border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
          <Lock className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span>Your ID and visa documents are encrypted and only used for verification.</span>
        </div>
      </div>
    </main>
  );
}
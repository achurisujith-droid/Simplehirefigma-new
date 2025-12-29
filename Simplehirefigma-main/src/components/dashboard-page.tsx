import { ProductStatusCard } from "./product-status-card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ReferenceStatusCard, ReferenceItem } from "./reference-status-card";
import { 
  Lock, 
  Award, 
  TrendingUp, 
  Download, 
  Share2, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ExternalLink,
  FileCheck,
  Shield,
  Users,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

interface DashboardPageProps {
  onSelectPlan?: (plan: { id: string; name: string; price: string }) => void;
  purchasedProducts?: string[];
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
  onViewCertificate?: (productId: string) => void;
}

export function DashboardPage({ 
  onSelectPlan, 
  purchasedProducts = [],
  interviewProgress,
  idVerificationStatus = "not-started",
  referenceCheckStatus = "not-started",
  references = [],
  onStartInterview,
  onStartIdVerification,
  onStartReferenceCheck,
  onViewCertificate
}: DashboardPageProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Calculate statistics
  const totalProducts = purchasedProducts.length;
  const hasAllProducts = totalProducts === 3;
  
  // Calculate completion status
  const skillComplete = interviewProgress?.voiceInterview && interviewProgress?.mcqTest && interviewProgress?.codingChallenge;
  const idComplete = idVerificationStatus === "verified";
  const referenceComplete = referenceCheckStatus === "verified";
  
  const completedCount = [
    purchasedProducts.includes('skill') && skillComplete,
    purchasedProducts.includes('id-visa') && idComplete,
    purchasedProducts.includes('reference') && referenceComplete
  ].filter(Boolean).length;

  const certificatesEarned = completedCount;
  
  // Calculate overall progress
  const calculateProgress = () => {
    if (totalProducts === 0) return 0;
    
    let totalSteps = 0;
    let completedSteps = 0;
    
    // Skill verification (4 steps)
    if (purchasedProducts.includes('skill')) {
      totalSteps += 4;
      if (interviewProgress?.voiceInterview) completedSteps++;
      if (interviewProgress?.mcqTest) completedSteps++;
      if (interviewProgress?.codingChallenge) completedSteps++;
      if (skillComplete) completedSteps++;
    }
    
    // ID verification (4 steps)
    if (purchasedProducts.includes('id-visa')) {
      totalSteps += 4;
      if (idVerificationStatus !== "not-started") completedSteps++;
      if (idVerificationStatus === "pending" || idVerificationStatus === "verified") completedSteps += 2;
      if (idVerificationStatus === "verified") completedSteps++;
    }
    
    // Reference check (4 steps - based on actual reference data)
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

  // Product data with status
  const productData = [
    {
      id: "skill",
      title: "Skill verification",
      description: "AI-powered interview validates your professional skills",
      icon: Award,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
      status: skillComplete ? "complete" : (interviewProgress?.voiceInterview || interviewProgress?.mcqTest || interviewProgress?.codingChallenge) ? "in-progress" : "not-started",
      progress: purchasedProducts.includes('skill') ? 
        ((interviewProgress?.voiceInterview ? 25 : 0) + (interviewProgress?.mcqTest ? 25 : 0) + (interviewProgress?.codingChallenge ? 25 : 0) + (skillComplete ? 25 : 0)) : 0,
      steps: [
        { label: "Voice Interview", completed: interviewProgress?.voiceInterview || false },
        { label: "MCQ Test", completed: interviewProgress?.mcqTest || false },
        { label: "Coding Challenge", completed: interviewProgress?.codingChallenge || false },
        { label: "Certificate ready", completed: skillComplete || false }
      ],
      nextAction: skillComplete 
        ? "Certificate ready to share"
        : interviewProgress?.mcqTest 
        ? "Complete coding challenge"
        : interviewProgress?.voiceInterview
        ? "Take MCQ test"
        : "Start voice interview",
      onAction: skillComplete ? () => onViewCertificate?.('skill') : onStartInterview,
      certificateUrl: skillComplete ? `/certificate/skill-123456` : null
    },
    {
      id: "id-visa",
      title: "ID + Visa verification",
      description: "Validate government ID and work authorization",
      icon: Shield,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100",
      status: idComplete ? "complete" : (idVerificationStatus === "pending" || idVerificationStatus === "in-progress") ? "in-progress" : "not-started",
      progress: idVerificationStatus === "verified" ? 100 : idVerificationStatus === "pending" ? 100 : idVerificationStatus === "in-progress" ? 50 : 0,
      steps: [
        { label: "Upload ID", completed: idVerificationStatus !== "not-started" },
        { label: "Upload visa/EAD", completed: idVerificationStatus !== "not-started" },
        { label: "Selfie verification", completed: idVerificationStatus !== "not-started" },
        { label: idVerificationStatus === "pending" ? "Under review" : "Review complete", completed: idVerificationStatus === "verified" }
      ],
      nextAction: idVerificationStatus === "verified" ? "Verification complete" : idVerificationStatus === "pending" ? "Under review (24-48hrs)" : "Upload ID document",
      onAction: onStartIdVerification,
      certificateUrl: null
    },
    {
      id: "reference",
      title: "Reference check",
      description: "Professional references collection and verification",
      icon: Users,
      iconColor: "text-green-600",
      iconBg: "bg-green-100",
      status: referenceComplete 
        ? "complete" 
        : references.some(ref => ref.status === "email-sent" || ref.status === "response-received" || ref.status === "verified")
        ? "in-progress"
        : references.length > 0
        ? "in-progress"
        : "not-started",
      progress: referenceComplete 
        ? 100 
        : references.length > 0 && references.every(ref => ref.status === "verified")
        ? 100
        : references.some(ref => ref.status === "response-received" || ref.status === "verified")
        ? 75
        : references.some(ref => ref.status === "email-sent")
        ? 50
        : references.length > 0
        ? 25
        : 0,
      steps: [
        { 
          label: references.length === 0 
            ? "Add referees (0/5)" 
            : `${references.length} referee${references.length > 1 ? 's' : ''} added${references.length < 5 ? `, can add ${5 - references.length} more` : ''}`, 
          completed: references.length > 0 
        },
        { 
          label: `Emails sent${references.some(ref => ref.status === "email-sent" || ref.status === "response-received" || ref.status === "verified") ? ` (${references.filter(ref => ref.status === "email-sent" || ref.status === "response-received" || ref.status === "verified").length})` : ''}`, 
          completed: references.some(ref => ref.status === "email-sent" || ref.status === "response-received" || ref.status === "verified") 
        },
        { 
          label: (() => {
            const received = references.filter(ref => ref.status === "response-received" || ref.status === "verified").length;
            const pending = references.filter(ref => ref.status === "pending" || ref.status === "email-sent").length;
            if (received > 0 && pending > 0) {
              return `${received} received, ${pending} waiting`;
            } else if (received > 0) {
              return `${received} response${received > 1 ? 's' : ''} received`;
            } else if (pending > 0) {
              return `Waiting for ${pending} response${pending > 1 ? 's' : ''}`;
            } else {
              return "Responses received";
            }
          })(),
          completed: references.some(ref => ref.status === "response-received" || ref.status === "verified") 
        },
        { 
          label: references.length > 0 && references.every(ref => ref.status === "verified")
            ? "Summary ready" 
            : "Summary pending", 
          completed: references.length > 0 && references.every(ref => ref.status === "verified") 
        }
      ],
      nextAction: referenceComplete 
        ? "Reference check complete" 
        : references.some(ref => ref.status === "email-sent")
        ? `Waiting for ${references.filter(ref => ref.status === "pending" || ref.status === "email-sent").length} response${references.filter(ref => ref.status === "pending" || ref.status === "email-sent").length > 1 ? 's' : ''}`
        : references.length > 0
        ? "Submit references for verification"
        : "Add reference contacts",
      onAction: onStartReferenceCheck,
      certificateUrl: null
    }
  ];

  const userProducts = productData.filter(p => purchasedProducts.includes(p.id));
  const activeProducts = userProducts.filter(p => p.status === "in-progress");
  const completedProducts = userProducts.filter(p => p.status === "complete");
  const pendingProducts = userProducts.filter(p => p.status === "not-started");

  const handleShareCertificate = (productId: string, url: string) => {
    navigator.clipboard.writeText(`https://simplehire.ai${url}`);
    setCopiedLink(productId);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // First-time user (no products)
  if (totalProducts === 0) {
    return (
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-slate-900 mb-2">Welcome to Simplehire! 👋</h1>
          <p className="text-slate-600">
            Get verified and stand out to employers with professional credentials
          </p>
        </div>

        {/* Value proposition cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-slate-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-slate-900 mb-2">Skill verification</h3>
            <p className="text-sm text-slate-600 mb-4">
              AI-powered interview to validate your technical skills with instant assessment
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                15-min AI interview
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Shareable certificate
              </li>
            </ul>
          </Card>

          <Card className="p-6 border-slate-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-slate-900 mb-2">ID + Visa verification</h3>
            <p className="text-sm text-slate-600 mb-4">
              Validate your identity and work authorization with secure document processing
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Government ID check
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Work authorization
              </li>
            </ul>
          </Card>

          <Card className="p-6 border-slate-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-slate-900 mb-2">Reference check</h3>
            <p className="text-sm text-slate-600 mb-4">
              Automated collection of professional references to strengthen your profile
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Up to 3 references
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Automated outreach
              </li>
            </ul>
          </Card>
        </div>

        {/* Get Started CTA */}
        <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm mb-4">
                <Sparkles className="w-4 h-4" />
                <span>Get started today</span>
              </div>
              <h2 className="text-slate-900 mb-2">Ready to get verified?</h2>
              <p className="text-slate-700 mb-6">
                Choose a verification plan and start building your professional credentials.
              </p>
              <Button 
                onClick={() => onSelectPlan?.({ id: 'combo', name: 'Complete combo', price: '$60' })}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                View pricing & plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Trust indicators */}
        <div className="mt-8 flex items-center justify-center gap-8 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Secure payment</span>
          </div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4" />
            <span>Instant verification</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            <span>Shareable certificates</span>
          </div>
        </div>
      </main>
    );
  }

  // User with products
  return (
    <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-12">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">
          Track your verification progress and manage your credentials
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Overall progress */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Overall progress</p>
                <p className="text-2xl text-slate-900">{progressPercentage}%</p>
              </div>
            </div>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {completedCount} of {totalProducts} verification{totalProducts !== 1 ? 's' : ''} complete
          </p>
        </Card>

        {/* Certificates earned */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Certificates earned</p>
              <p className="text-2xl text-slate-900">{certificatesEarned}</p>
            </div>
          </div>
          {certificatesEarned > 0 ? (
            <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-3 h-3" />
              Ready to share with employers
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-2">
              Complete verifications to earn certificates
            </p>
          )}
        </Card>

        {/* Active tasks */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Pending tasks</p>
              <p className="text-2xl text-slate-900">
                {activeProducts.length + pendingProducts.length}
              </p>
            </div>
          </div>
          {(activeProducts.length + pendingProducts.length) > 0 ? (
            <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
              <Clock className="w-3 h-3" />
              Continue where you left off
            </p>
          ) : (
            <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-3 h-3" />
              All tasks complete!
            </p>
          )}
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left column - Products (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Completed certificates */}
          {completedProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-slate-900">Your certificates</h2>
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  {completedProducts.length} ready
                </Badge>
              </div>
              <div className="space-y-4">
                {completedProducts.map((product) => (
                  <Card key={product.id} className="p-6 border-green-200 bg-green-50">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 ${product.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <product.icon className={`w-6 h-6 ${product.iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-slate-900">{product.title}</h3>
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Complete
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-4">
                            {product.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => product.onAction?.()}
                              variant="outline"
                              size="sm"
                              className="bg-white"
                            >
                              <Award className="w-4 h-4 mr-2" />
                              View certificate
                            </Button>
                            <Button
                              onClick={() => product.certificateUrl && handleShareCertificate(product.id, product.certificateUrl)}
                              variant="outline"
                              size="sm"
                              className="bg-white"
                            >
                              <Share2 className="w-4 h-4 mr-2" />
                              {copiedLink === product.id ? "Link copied!" : "Share link"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Active products */}
          {activeProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-slate-900">In progress</h2>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  {activeProducts.length} active
                </Badge>
              </div>
              <div className="space-y-4">
                {activeProducts.map((product) => (
                  <Card key={product.id} className="p-6 border-slate-200 hover:border-blue-200 transition-colors">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 ${product.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <product.icon className={`w-6 h-6 ${product.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-slate-900">{product.title}</h3>
                          <span className="text-sm text-slate-600">{product.progress}%</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                          {product.description}
                        </p>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                            style={{ width: `${product.progress}%` }}
                          />
                        </div>
                        
                        {/* Progress steps */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {product.steps.map((step, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              {step.completed ? (
                                <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                              ) : (
                                <div className="w-3 h-3 border-2 border-slate-300 rounded-full flex-shrink-0" />
                              )}
                              <span className={step.completed ? "text-slate-900" : "text-slate-500"}>
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                          <p className="text-sm text-slate-600">
                            Next: <span className="text-slate-900">{product.nextAction}</span>
                          </p>
                          <Button
                            onClick={() => product.onAction?.()}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Continue
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Pending products */}
          {pendingProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-slate-900">Ready to start</h2>
                <Badge variant="outline" className="text-slate-600">
                  {pendingProducts.length} waiting
                </Badge>
              </div>
              <div className="space-y-4">
                {pendingProducts.map((product) => (
                  <Card key={product.id} className="p-6 border-slate-200 hover:border-blue-200 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${product.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <product.icon className={`w-6 h-6 ${product.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-slate-900 mb-1">{product.title}</h3>
                        <p className="text-sm text-slate-600 mb-4">
                          {product.description}
                        </p>
                        <Button
                          onClick={() => product.onAction?.()}
                          size="sm"
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          Start verification
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Quick actions */}
          <Card className="p-6 border-slate-200">
            <h3 className="text-slate-900 mb-4">Quick actions</h3>
            <div className="space-y-3">
              {certificatesEarned > 0 && (
                <button className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-slate-900">View all certificates</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}
              <button className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-left">
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-slate-900">Share my profile</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </Card>

          {/* Help & support */}
          <Card className="p-6 border-slate-200">
            <h3 className="text-slate-900 mb-4">Need help?</h3>
            <div className="space-y-3 text-sm">
              <a href="#" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                <ExternalLink className="w-4 h-4" />
                How verification works
              </a>
              <a href="#" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                <ExternalLink className="w-4 h-4" />
                FAQs & support
              </a>
              <a href="#" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                <ExternalLink className="w-4 h-4" />
                Contact us
              </a>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
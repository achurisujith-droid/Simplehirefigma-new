import { CheckCircle2, FileText, Share2, ExternalLink, AlertCircle, Clock } from "lucide-react";
import { ReferenceItem } from "./reference-status-card";

interface CompletionHelperPanelProps {
  purchasedProducts: string[];
  interviewProgress?: {
    documentsUploaded: boolean;
    voiceInterview: boolean;
    mcqTest: boolean;
    codingChallenge: boolean;
  };
  idVerificationStatus?: "not-started" | "in-progress" | "pending" | "verified";
  referenceCheckStatus?: "not-started" | "in-progress" | "pending" | "verified";
  references?: ReferenceItem[];
}

export function CompletionHelperPanel({ 
  purchasedProducts, 
  interviewProgress, 
  idVerificationStatus = "not-started",
  referenceCheckStatus = "not-started",
  references = []
}: CompletionHelperPanelProps) {
  // Calculate pending tasks based on real data
  const pendingTasks = [];

  // Check skill verification tasks
  if (purchasedProducts.includes('skill')) {
    if (!interviewProgress?.voiceInterview) {
      pendingTasks.push({
        icon: AlertCircle,
        title: "Complete voice interview",
        description: "Start your AI-powered skill verification interview",
        urgent: true
      });
    } else if (!interviewProgress?.mcqTest) {
      pendingTasks.push({
        icon: AlertCircle,
        title: "Complete MCQ test",
        description: "Answer technical questions to verify your knowledge",
        urgent: true
      });
    } else if (!interviewProgress?.codingChallenge) {
      pendingTasks.push({
        icon: AlertCircle,
        title: "Complete coding challenge",
        description: "Solve coding problems to showcase your skills",
        urgent: true
      });
    }
  }

  // Check ID verification tasks
  if (purchasedProducts.includes('id-visa')) {
    if (idVerificationStatus === "not-started") {
      pendingTasks.push({
        icon: AlertCircle,
        title: "Upload ID documents",
        description: "Submit your government ID and visa documents",
        urgent: true
      });
    } else if (idVerificationStatus === "pending") {
      pendingTasks.push({
        icon: Clock,
        title: "ID verification in review",
        description: "Your documents are being verified (1-2 business days)",
        urgent: false
      });
    }
  }

  // Check reference check tasks
  if (purchasedProducts.includes('reference')) {
    if (references.length === 0) {
      pendingTasks.push({
        icon: AlertCircle,
        title: "Add professional references",
        description: "Add 1-5 references to verify your work experience",
        urgent: true
      });
    } else {
      const pendingRefs = references.filter(ref => ref.status === "pending" || ref.status === "email-sent");
      const pendingCount = pendingRefs.length;
      
      if (pendingCount > 0) {
        pendingTasks.push({
          icon: Clock,
          title: `Waiting for ${pendingCount} reference response${pendingCount > 1 ? 's' : ''}`,
          description: "We've sent emails to your references",
          urgent: false
        });
      }
    }
  }

  // Completion steps (shown when no pending tasks)
  const completionSteps = [
    {
      icon: CheckCircle2,
      title: "All products completed",
      description: "Finish all three verifications to unlock your certificate"
    },
    {
      icon: FileText,
      title: "Certificate generated",
      description: "Your professional certificate will be created automatically"
    },
    {
      icon: Share2,
      title: "Share link available to recruiters",
      description: "Get a shareable link to showcase your verified credentials"
    }
  ];

  return (
    <div className="w-80 flex-shrink-0">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-8">
        {pendingTasks.length > 0 ? (
          <>
            <h3 className="text-slate-900 mb-6">Pending tasks ({pendingTasks.length})</h3>
            
            <div className="space-y-4 mb-6">
              {pendingTasks.map((task, index) => {
                const Icon = task.icon;
                return (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        task.urgent ? 'bg-amber-50' : 'bg-blue-50'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          task.urgent ? 'text-amber-600' : 'text-blue-600'
                        }`} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-900 mb-1">{task.title}</p>
                      <p className="text-xs text-slate-500">{task.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <h3 className="text-slate-900 mb-6">What happens after completion?</h3>
            
            <div className="space-y-6 mb-6">
              {completionSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-900 mb-1">{step.title}</p>
                      <p className="text-xs text-slate-500">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <a
          href="#"
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          View certificate examples
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
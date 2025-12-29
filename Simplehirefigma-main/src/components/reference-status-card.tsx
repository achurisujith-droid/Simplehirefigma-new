import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Clock, CheckCircle2, Users, Mail, FileCheck, ChevronRight } from "lucide-react";

export type ReferenceStatus = "pending" | "email-sent" | "response-received" | "verified";

export interface ReferenceItem {
  id: number;
  name: string;
  email: string;
  company: string;
  relation: string;
  status: ReferenceStatus;
  emailSentDate?: string;
  responseDate?: string;
}

interface ReferenceStatusCardProps {
  references: ReferenceItem[];
  onStartReferenceCheck: () => void;
}

export function ReferenceStatusCard({ references, onStartReferenceCheck }: ReferenceStatusCardProps) {
  // Calculate overall status
  const getOverallStatus = () => {
    if (references.length === 0) return "not-started";
    
    const allVerified = references.every(ref => ref.status === "verified");
    if (allVerified) return "verified";
    
    const anyEmailSent = references.some(ref => ref.status === "email-sent" || ref.status === "response-received" || ref.status === "verified");
    if (anyEmailSent) return "waiting-on-others";
    
    return "in-progress";
  };

  const getStatusBadge = () => {
    const status = getOverallStatus();
    
    switch (status) {
      case "not-started":
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Not started</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">In progress</Badge>;
      case "waiting-on-others":
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Waiting on others</Badge>;
      case "verified":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Verified</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Not started</Badge>;
    }
  };

  const getLastActivity = () => {
    const status = getOverallStatus();
    
    if (status === "not-started") return "Not started";
    if (status === "verified") return "All references verified";
    
    const latestResponse = references
      .filter(ref => ref.responseDate)
      .sort((a, b) => new Date(b.responseDate!).getTime() - new Date(a.responseDate!).getTime())[0];
    
    if (latestResponse) {
      return `Response received ${formatDate(latestResponse.responseDate!)}`;
    }
    
    const latestEmail = references
      .filter(ref => ref.emailSentDate)
      .sort((a, b) => new Date(b.emailSentDate!).getTime() - new Date(a.emailSentDate!).getTime())[0];
    
    if (latestEmail) {
      return `Email sent ${formatDate(latestEmail.emailSentDate!)}`;
    }
    
    return "References added";
  };

  const getNextStep = () => {
    const status = getOverallStatus();
    
    if (status === "not-started") return "Start with adding referees";
    if (status === "verified") return "All verifications complete";
    
    const pendingCount = references.filter(ref => ref.status === "pending").length;
    if (pendingCount > 0) return `Submit ${pendingCount} reference${pendingCount > 1 ? 's' : ''} for verification`;
    
    const emailSentCount = references.filter(ref => ref.status === "email-sent").length;
    if (emailSentCount > 0) return "Wait for responses from referees";
    
    const responseCount = references.filter(ref => ref.status === "response-received").length;
    if (responseCount > 0) return "Responses being verified";
    
    return "Complete remaining steps";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "yesterday";
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate metrics
  const refereeCount = references.length;
  const responsesReceived = references.filter(ref => ref.status === "response-received" || ref.status === "verified").length;
  const pendingCount = references.filter(ref => ref.status === "pending" || ref.status === "email-sent").length;

  // Calculate stage progress
  const currentStage = () => {
    if (references.length === 0) return 0;
    if (references.every(ref => ref.status === "verified")) return 4;
    if (references.some(ref => ref.status === "response-received" || ref.status === "verified")) return 3;
    if (references.some(ref => ref.status === "email-sent")) return 2;
    return 1;
  };

  const stage = currentStage();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-slate-900">Reference check</h3>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
              Included in your plan
            </Badge>
          </div>
          <p className="text-sm text-slate-600">
            Automated collection and verification of professional references
          </p>
        </div>
        {getOverallStatus() === "not-started" && (
          <Button 
            onClick={onStartReferenceCheck}
            variant="outline"
            size="sm"
          >
            Start reference check
          </Button>
        )}
      </div>

      {/* Current Status */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-sm text-slate-600">Current status</p>
          {getStatusBadge()}
        </div>

        {/* Progress tracker */}
        <div className="flex items-center gap-2 mb-6">
          {/* Stage 1 */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
              stage >= 1 ? 'bg-blue-600' : 'bg-slate-200'
            }`}>
              {stage >= 1 ? (
                <CheckCircle2 className="w-4 h-4 text-white" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-white"></div>
              )}
            </div>
            <p className="text-xs text-slate-600 text-center">Add<br/>referees</p>
          </div>

          <div className={`flex-1 h-0.5 ${stage >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>

          {/* Stage 2 */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
              stage >= 2 ? 'bg-blue-600' : 'bg-slate-200'
            }`}>
              {stage >= 2 ? (
                <CheckCircle2 className="w-4 h-4 text-white" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-white"></div>
              )}
            </div>
            <p className="text-xs text-slate-600 text-center">Emails<br/>sent</p>
          </div>

          <div className={`flex-1 h-0.5 ${stage >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>

          {/* Stage 3 */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
              stage >= 3 ? 'bg-blue-600' : 'bg-slate-200'
            }`}>
              {stage >= 3 ? (
                <CheckCircle2 className="w-4 h-4 text-white" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-white"></div>
              )}
            </div>
            <p className="text-xs text-slate-600 text-center">Responses<br/>received</p>
          </div>

          <div className={`flex-1 h-0.5 ${stage >= 4 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>

          {/* Stage 4 */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
              stage >= 4 ? 'bg-blue-600' : 'bg-slate-200'
            }`}>
              {stage >= 4 ? (
                <CheckCircle2 className="w-4 h-4 text-white" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-white"></div>
              )}
            </div>
            <p className="text-xs text-slate-600 text-center">Summary<br/>ready</p>
          </div>
        </div>
      </div>

      {/* Activity & Next Step */}
      <div className="space-y-3 mb-6">
        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
          <div>
            <p className="text-xs text-slate-500">Last activity</p>
            <p className="text-sm text-slate-900">{getLastActivity()}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5" />
          <div>
            <p className="text-xs text-slate-500">Next step</p>
            <p className="text-sm text-slate-900">{getNextStep()}</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      {references.length > 0 && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-sm text-slate-900">{refereeCount} referee{refereeCount !== 1 ? 's' : ''}</p>
              <p className="text-xs text-slate-500">added</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-sm text-slate-900">{responsesReceived} response{responsesReceived !== 1 ? 's' : ''}</p>
              <p className="text-xs text-slate-500">received</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <div>
              <p className="text-sm text-slate-900">{pendingCount}</p>
              <p className="text-xs text-slate-500">pending</p>
            </div>
          </div>
        </div>
      )}

      {/* View details link */}
      {references.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <button 
            onClick={onStartReferenceCheck}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View details
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Check, Circle, Clock, Users, ChevronRight, ChevronDown, Mail, FileCheck } from "lucide-react";
import { useState } from "react";

interface Step {
  label: string;
  completed: boolean;
  current?: boolean;
}

interface Detail {
  label: string;
  icon: "users" | "check" | "clock";
}

interface IndividualReference {
  name: string;
  company: string;
  email: string;
  status: string;
  statusLabel: string;
  statusColor: "blue" | "amber" | "purple" | "green";
  date?: string;
}

interface ProductStatusCardProps {
  title: string;
  statusLabel: string;
  description: string;
  status: string;
  statusColor: "blue" | "amber" | "purple" | "green";
  steps: Step[];
  buttonText: string;
  buttonVariant: "primary" | "secondary";
  lastActivity: string;
  nextAction: string;
  details?: Detail[];
  onButtonClick?: () => void;
  individualReferences?: IndividualReference[];
}

export function ProductStatusCard({
  title,
  statusLabel,
  description,
  status,
  statusColor,
  steps,
  buttonText,
  buttonVariant,
  lastActivity,
  nextAction,
  details = [],
  onButtonClick,
  individualReferences = []
}: ProductStatusCardProps) {
  const statusColors = {
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    green: "bg-green-100 text-green-700 border-green-200"
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "users":
        return <Users className="w-4 h-4 text-slate-500" />;
      case "check":
        return <Check className="w-4 h-4 text-green-600" />;
      case "clock":
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const [showReferences, setShowReferences] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "yesterday";
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-6">
        {/* Left section */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-slate-900">{title}</h3>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
              {statusLabel}
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mb-6">{description}</p>

          {/* Status section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-slate-600">Current status</span>
              <Badge className={`${statusColors[statusColor]} text-xs px-2 py-0.5`}>
                {status}
              </Badge>
            </div>

            {/* Progress stepper */}
            <div className="flex items-center gap-2">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                        step.completed
                          ? "bg-blue-600 text-white"
                          : step.current
                          ? "bg-blue-100 text-blue-600 ring-2 ring-blue-600 ring-offset-2"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {step.completed ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Circle className="w-3 h-3" />
                      )}
                    </div>
                    <span
                      className={`text-xs text-center ${
                        step.completed || step.current
                          ? "text-slate-900"
                          : "text-slate-500"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 w-full mb-8 ${
                        step.completed ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Activity details */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Last activity</p>
                <p className="text-sm text-slate-700">{lastActivity}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Next step</p>
                <p className="text-sm text-slate-900">{nextAction}</p>
              </div>
            </div>
          </div>

          {/* Additional details for reference check */}
          {details.length > 0 && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200">
              {details.map((detail, index) => (
                <div key={index} className="flex items-center gap-2">
                  {getIcon(detail.icon)}
                  <span className="text-sm text-slate-700">{detail.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Individual references */}
          {individualReferences.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <button 
                onClick={() => setShowReferences(!showReferences)}
                className="flex items-center justify-between w-full mb-3 text-sm text-slate-700 hover:text-slate-900"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  View individual reference status ({individualReferences.length})
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showReferences ? "rotate-180" : ""}`} />
              </button>
              
              {showReferences && (
                <div className="space-y-2 mt-3">
                  {individualReferences.map((reference, index) => (
                    <div key={index} className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm text-slate-900">{reference.name}</p>
                          <Badge className={`${statusColors[reference.statusColor]} text-xs`}>
                            {reference.statusLabel}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">{reference.company} • {reference.email}</p>
                        {reference.date && (
                          <p className="text-xs text-slate-400 mt-1">
                            {reference.status === "verified" || reference.status === "response-received" 
                              ? `Response received ${formatDate(reference.date)}`
                              : `Email sent ${formatDate(reference.date)}`
                            }
                          </p>
                        )}
                      </div>
                      {reference.status === "verified" && (
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      )}
                      {reference.status === "email-sent" && (
                        <Mail className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      )}
                      {reference.status === "response-received" && (
                        <FileCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                      {reference.status === "pending" && (
                        <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right section - Action buttons */}
        <div className="flex flex-col gap-2 items-end justify-start pt-1">
          <Button
            onClick={onButtonClick}
            disabled={!onButtonClick}
            className={
              buttonVariant === "primary"
                ? "bg-blue-600 hover:bg-blue-700 text-white min-w-[200px] disabled:bg-slate-300 disabled:cursor-not-allowed"
                : "bg-white hover:bg-slate-50 text-slate-900 border-slate-300 min-w-[200px] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            }
            variant={buttonVariant === "primary" ? "default" : "outline"}
          >
            {buttonText}
          </Button>
          <button className="text-sm text-blue-600 hover:text-blue-700">
            View details
          </button>
        </div>
      </div>
    </div>
  );
}
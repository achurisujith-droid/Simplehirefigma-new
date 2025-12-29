import { Badge } from "./ui/badge";
import { CreditCard, FileText, Camera, CheckCircle2, Clock } from "lucide-react";

interface VerificationStatusPanelProps {
  currentStep: number;
}

export function VerificationStatusPanel({ currentStep }: VerificationStatusPanelProps) {
  const statusItems = [
    {
      icon: CreditCard,
      label: "ID document",
      status: currentStep >= 1 ? "Verified" : "Pending",
      statusColor: currentStep >= 1 ? "green" : "slate"
    },
    {
      icon: FileText,
      label: "Visa / Work auth",
      status: currentStep >= 2 ? "In review" : "Pending",
      statusColor: currentStep >= 2 ? "blue" : "slate"
    },
    {
      icon: Camera,
      label: "Selfie capture",
      status: currentStep >= 3 ? "Verified" : "Pending",
      statusColor: currentStep >= 3 ? "green" : "slate"
    },
    {
      icon: CheckCircle2,
      label: "Final review",
      status: currentStep >= 4 ? "In review" : "Pending",
      statusColor: currentStep >= 4 ? "blue" : "slate"
    }
  ];

  const getStatusBadge = (color: string, text: string) => {
    const colors = {
      green: "bg-green-100 text-green-700",
      blue: "bg-blue-100 text-blue-700",
      slate: "bg-slate-100 text-slate-500"
    };
    return (
      <Badge className={`${colors[color as keyof typeof colors]} text-xs`}>
        {text}
      </Badge>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-slate-900 mb-4">Verification status</h3>

      <div className="space-y-4 mb-6">
        {statusItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900">{item.label}</p>
              </div>
              {getStatusBadge(item.statusColor, item.status)}
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
        <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-900">
          <strong>Typical review time:</strong> 24–48 hours after submission
        </p>
      </div>
    </div>
  );
}

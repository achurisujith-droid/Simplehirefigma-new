import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { VisaDocumentUploader } from "./visa-document-uploader";
import { useState } from "react";
import { AlertCircle, Info, Globe, GraduationCap, Building2, FileText } from "lucide-react";

interface UploadVisaStepProps {
  onBack: () => void;
  onContinue: () => void;
}

const statusInfo: Record<string, { icon: React.ElementType; description: string; requiredDocs: string[] }> = {
  "us-citizen": {
    icon: Globe,
    description: "US citizens can work without restrictions",
    requiredDocs: ["US Passport", "Birth Certificate", "or Naturalization Certificate"]
  },
  "green-card": {
    icon: Globe,
    description: "Lawful Permanent Residents can work without restrictions",
    requiredDocs: ["Green Card (Form I-551) - both sides"]
  },
  "h1b": {
    icon: Building2,
    description: "Employment-based visa for specialty occupations",
    requiredDocs: ["I-797 Approval Notice", "I-94 Arrival/Departure Record", "Valid Passport"]
  },
  "h4": {
    icon: Building2,
    description: "Dependent visa - requires EAD for work authorization",
    requiredDocs: ["I-797 for H-4 Status", "Spouse's H-1B I-797"]
  },
  "h4-ead": {
    icon: Building2,
    description: "H-4 visa with Employment Authorization",
    requiredDocs: ["EAD Card (I-766)", "H-4 I-797", "Spouse's H-1B I-797"]
  },
  "f1-student": {
    icon: GraduationCap,
    description: "On-campus employment only (up to 20hrs/week)",
    requiredDocs: ["I-20 (with employment authorization)", "F-1 Visa", "Valid Passport"]
  },
  "f1-cpt": {
    icon: GraduationCap,
    description: "Curricular Practical Training for F-1 students",
    requiredDocs: ["I-20 with CPT authorization", "F-1 Visa", "Valid Passport"]
  },
  "f1-opt": {
    icon: GraduationCap,
    description: "Optional Practical Training (12 months post-graduation)",
    requiredDocs: ["EAD Card (I-766)", "I-20 with OPT recommendation", "I-94"]
  },
  "f1-stem-opt": {
    icon: GraduationCap,
    description: "24-month STEM extension for OPT",
    requiredDocs: ["STEM EAD Card", "I-20 with STEM OPT", "I-983 Training Plan"]
  },
  "l1": {
    icon: Building2,
    description: "Intra-company transferee visa",
    requiredDocs: ["I-797 Approval Notice", "I-94", "Valid Passport"]
  },
  "l2": {
    icon: Building2,
    description: "L-1 dependent - requires EAD for work authorization",
    requiredDocs: ["I-797 for L-2 Status", "Spouse's L-1 I-797"]
  },
  "l2-ead": {
    icon: Building2,
    description: "L-2 visa with Employment Authorization",
    requiredDocs: ["EAD Card (I-766)", "L-2 I-797", "Spouse's L-1 I-797"]
  },
  "other": {
    icon: FileText,
    description: "Other work authorization status",
    requiredDocs: ["Upload all relevant work authorization documents"]
  }
};

export function UploadVisaStep({ onBack, onContinue }: UploadVisaStepProps) {
  const [visaStatus, setVisaStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleContinue = () => {
    if (!visaStatus) {
      setError("Please select your work authorization status");
      return;
    }
    
    // Store visa status
    sessionStorage.setItem('visa_status', visaStatus);
    onContinue();
  };

  const currentStatusInfo = visaStatus ? statusInfo[visaStatus] : null;
  const StatusIcon = currentStatusInfo?.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
      <h2 className="text-slate-900 mb-2">Step 2 · Work authorization</h2>
      <p className="text-sm text-slate-600 mb-6">
        Select your current status and upload the required documents
      </p>

      {/* Status selector */}
      <div className="mb-6">
        <label className="block text-sm text-slate-700 mb-2">
          Your current work authorization status <span className="text-red-500">*</span>
        </label>
        <Select value={visaStatus} onValueChange={(value) => {
          setVisaStatus(value);
          setError("");
        }}>
          <SelectTrigger className={`w-full ${error ? 'border-red-500' : ''}`}>
            <SelectValue placeholder="Select your work authorization status" />
          </SelectTrigger>
          <SelectContent>
            <div className="px-2 py-1.5 text-xs font-medium text-slate-500 uppercase">US Authorization</div>
            <SelectItem value="us-citizen">🇺🇸 US Citizen</SelectItem>
            <SelectItem value="green-card">💚 Green Card (LPR)</SelectItem>
            
            <div className="px-2 py-1.5 text-xs font-medium text-slate-500 uppercase mt-2">H Visas</div>
            <SelectItem value="h1b">H-1B (Work Visa)</SelectItem>
            <SelectItem value="h4">H-4 (Dependent)</SelectItem>
            <SelectItem value="h4-ead">H-4 EAD (Work Authorization)</SelectItem>
            
            <div className="px-2 py-1.5 text-xs font-medium text-slate-500 uppercase mt-2">F-1 Student</div>
            <SelectItem value="f1-student">F-1 Student (On-campus only)</SelectItem>
            <SelectItem value="f1-cpt">F-1 CPT</SelectItem>
            <SelectItem value="f1-opt">F-1 OPT</SelectItem>
            <SelectItem value="f1-stem-opt">F-1 STEM OPT</SelectItem>
            
            <div className="px-2 py-1.5 text-xs font-medium text-slate-500 uppercase mt-2">L Visas</div>
            <SelectItem value="l1">L-1 (Intra-company Transfer)</SelectItem>
            <SelectItem value="l2">L-2 (Dependent)</SelectItem>
            <SelectItem value="l2-ead">L-2 EAD (Work Authorization)</SelectItem>
            
            <div className="px-2 py-1.5 text-xs font-medium text-slate-500 uppercase mt-2">Other</div>
            <SelectItem value="other">Other work authorization</SelectItem>
          </SelectContent>
        </Select>
        {error && (
          <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>

      {/* Status information card */}
      {currentStatusInfo && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
          <div className="flex items-start gap-3">
            {StatusIcon && (
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <StatusIcon className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <div className="flex-1">
              <h4 className="text-sm text-blue-900 mb-1">
                {visaStatus.toUpperCase().replace(/-/g, ' ')}
              </h4>
              <p className="text-sm text-blue-800 mb-3">{currentStatusInfo.description}</p>
              
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-blue-900 mb-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <strong>Required documents for your status:</strong>
                </p>
                <ul className="space-y-1">
                  {currentStatusInfo.requiredDocs.map((doc, idx) => (
                    <li key={idx} className="text-sm text-blue-900 flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic document uploader */}
      {visaStatus && <VisaDocumentUploader status={visaStatus} />}

      {/* Helper text */}
      {visaStatus && (
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4 mb-6">
          <p className="text-sm text-amber-900">
            💡 <strong>Tip:</strong> Make sure all documents are current and not expired. You can update these documents before final submission.
          </p>
        </div>
      )}

      {/* Privacy note */}
      <div className="bg-slate-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-slate-700">
          🔒 <strong>Privacy:</strong> Your documents are encrypted using bank-level security and will only be used for work authorization verification. We never share your information with third parties without your consent.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button onClick={onBack} variant="ghost">
          Back to ID upload
        </Button>
        <div className="flex gap-3">
          <Button variant="ghost" className="text-slate-600">Save & exit</Button>
          <Button 
            onClick={handleContinue}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          >
            Continue to selfie
          </Button>
        </div>
      </div>
    </div>
  );
}

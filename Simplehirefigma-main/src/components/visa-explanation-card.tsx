import { Shield, Eye, Trash2 } from "lucide-react";

export function VisaExplanationCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-slate-900 mb-4">How we use these documents</h3>
      
      <div className="space-y-4">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700">
            We verify that your identity and work authorization match your profile
          </p>
        </div>
        
        <div className="flex gap-3">
          <Eye className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700">
            Recruiters see only your verification result, not raw documents
          </p>
        </div>
        
        <div className="flex gap-3">
          <Trash2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700">
            You can request deletion of documents at any time
          </p>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          🔒 All documents are encrypted and stored securely in compliance with SOC 2 standards
        </p>
      </div>
    </div>
  );
}

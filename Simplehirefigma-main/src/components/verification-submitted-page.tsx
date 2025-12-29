import { Button } from "./ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface VerificationSubmittedPageProps {
  onBackToDashboard: () => void;
}

export function VerificationSubmittedPage({ onBackToDashboard }: VerificationSubmittedPageProps) {
  return (
    <main className="max-w-[1440px] mx-auto px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          {/* Success icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>

          {/* Title */}
          <h1 className="text-slate-900 mb-4">Verification submitted successfully!</h1>
          
          {/* Message */}
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            Thank you for submitting your ID and visa verification documents. Our team will review your submission within 24-48 hours.
          </p>

          {/* Status update info */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="text-slate-900 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Your documents will be reviewed by our verification team</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>You'll receive an email notification once the review is complete</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Results will be updated in your dashboard under "My products"</span>
              </li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-center">
            <Button onClick={onBackToDashboard} className="bg-blue-600 hover:bg-blue-700 text-white">
              Back to dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

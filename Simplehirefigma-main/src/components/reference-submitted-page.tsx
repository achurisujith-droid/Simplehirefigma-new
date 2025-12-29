import { Button } from "./ui/button";
import { CheckCircle2, ArrowRight, Mail } from "lucide-react";

interface ReferenceSubmittedPageProps {
  onBackToDashboard: () => void;
}

export function ReferenceSubmittedPage({ onBackToDashboard }: ReferenceSubmittedPageProps) {
  return (
    <main className="max-w-[1440px] mx-auto px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          {/* Success icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>

          {/* Title */}
          <h1 className="text-slate-900 mb-4">References submitted successfully!</h1>
          
          {/* Message */}
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            Thank you for submitting your professional references. We've sent verification requests to all your references.
          </p>

          {/* Status update info */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="text-slate-900 mb-3">What happens next?</h3>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-900 mb-1">Emails sent to your references</p>
                  <p className="text-slate-600">We've notified all your references with a simple verification form</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-900 mb-1">Responses tracked automatically</p>
                  <p className="text-slate-600">You'll see the status of each response in your dashboard</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-900 mb-1">Results updated in dashboard</p>
                  <p className="text-slate-600">Typical completion time is 5-7 business days</p>
                </div>
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

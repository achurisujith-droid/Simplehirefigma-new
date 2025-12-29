import { Check, ExternalLink, AlertCircle } from "lucide-react";

export function ReferenceGuidancePanel() {
  const tips = [
    "Choose references who know your work well",
    "Inform your references before adding them",
    "Use professional email addresses",
    "Add 1-5 references (minimum 1 required)",
    "More references strengthen your profile"
  ];

  return (
    <div className="w-80 flex-shrink-0 space-y-6">
      {/* Tips card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-slate-900 mb-4">Reference tips</h3>

        <ul className="space-y-3 mb-6">
          {tips.map((tip, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>

        <a
          href="#"
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          Learn about reference checks
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* What happens next card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-slate-900 mb-4">What happens next?</h3>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs flex-shrink-0">
              1
            </div>
            <p className="text-sm text-slate-700">
              We'll send an email to your references
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs flex-shrink-0">
              2
            </div>
            <p className="text-sm text-slate-700">
              They'll complete a short verification form
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs flex-shrink-0">
              3
            </div>
            <p className="text-sm text-slate-700">
              Results appear in your dashboard within 7 days
            </p>
          </div>
        </div>
      </div>

      {/* Privacy note */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="flex gap-2">
          <AlertCircle className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-600">
            Your references will only be contacted for verification purposes and their responses will be kept confidential.
          </p>
        </div>
      </div>
    </div>
  );
}
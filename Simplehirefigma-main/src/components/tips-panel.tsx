import { Check, ExternalLink } from "lucide-react";

export function TipsPanel() {
  const tips = [
    "Upload clear, uncropped images",
    "Ensure document details are readable",
    "Use the same name as on your resume and legal documents",
    "Make sure documents haven't expired"
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-slate-900 mb-4">Tips for faster approval</h3>

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
        How we store and protect your documents
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

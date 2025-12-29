import { ShoppingCart, ClipboardCheck, Award, ExternalLink } from "lucide-react";

export function GettingStartedPanel() {
  const steps = [
    {
      icon: ShoppingCart,
      title: "Choose your plan",
      description: "Select the verification package that fits your needs"
    },
    {
      icon: ClipboardCheck,
      title: "Complete interviews and verifications",
      description: "Finish your AI interviews and upload required documents"
    },
    {
      icon: Award,
      title: "Download and share your certificate",
      description: "Get your certification and share it with employers"
    }
  ];

  return (
    <div className="w-80 flex-shrink-0">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-8">
        <h3 className="text-slate-900 mb-6">Getting started</h3>
        
        <div className="space-y-6 mb-6">
          {steps.map((step, index) => {
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

        <a
          href="#"
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          Learn how Simplehire works
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

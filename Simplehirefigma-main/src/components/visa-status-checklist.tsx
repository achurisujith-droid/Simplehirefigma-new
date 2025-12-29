import { FileText, GraduationCap, Building2, Globe } from "lucide-react";

export function VisaStatusChecklist() {
  const statuses = [
    {
      icon: Globe,
      status: "US Citizen / Green Card",
      docs: "Passport or Green Card",
      color: "text-green-600"
    },
    {
      icon: Building2,
      status: "H-1B / L-1",
      docs: "I-797 + I-94 + Paystub",
      color: "text-blue-600"
    },
    {
      icon: GraduationCap,
      status: "F-1 OPT / STEM OPT",
      docs: "EAD + I-20 + I-94",
      color: "text-purple-600"
    },
    {
      icon: FileText,
      status: "H-4 / L-2 (with EAD)",
      docs: "EAD + Spouse I-797",
      color: "text-orange-600"
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-slate-900 mb-4">Status checklist</h3>
      <p className="text-xs text-slate-600 mb-4">
        Quick reference for common visa categories
      </p>
      
      <div className="space-y-3">
        {statuses.map((item, index) => (
          <div key={index} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
            <div className={`w-8 h-8 rounded-lg bg-opacity-10 flex items-center justify-center flex-shrink-0 ${item.color.replace('text-', 'bg-')}`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-900 mb-0.5">{item.status}</p>
              <p className="text-xs text-slate-600">{item.docs}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-600">
          💡 Need help? Check our{" "}
          <a href="#" className="text-blue-600 hover:text-blue-700">
            document requirements guide
          </a>
        </p>
      </div>
    </div>
  );
}

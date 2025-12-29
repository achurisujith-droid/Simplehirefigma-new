import { Eye, Monitor, CreditCard, ExternalLink } from "lucide-react";

export function InstructionsPanel() {
  const instructions = [
    {
      icon: Eye,
      text: "Look at the camera while answering"
    },
    {
      icon: Monitor,
      text: "Do not minimize or switch tabs frequently"
    },
    {
      icon: CreditCard,
      text: "Keep your ID document nearby"
    },
    {
      icon: Eye,
      text: "Ensure your face is clearly visible at all times"
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-slate-900 mb-4">Interview instructions</h3>
      
      <ul className="space-y-3 mb-4">
        {instructions.map((instruction, index) => {
          const Icon = instruction.icon;
          return (
            <li key={index} className="flex items-start gap-3 text-sm text-slate-700">
              <Icon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>{instruction.text}</span>
            </li>
          );
        })}
      </ul>

      <a
        href="#"
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
      >
        View full guidelines
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

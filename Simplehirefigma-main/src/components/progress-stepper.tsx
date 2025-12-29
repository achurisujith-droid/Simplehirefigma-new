import { Check, Circle } from "lucide-react";

interface Step {
  label: string;
  completed: boolean;
  current?: boolean;
}

interface ProgressStepperProps {
  steps: Step[];
}

export function ProgressStepper({ steps }: ProgressStepperProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  step.completed
                    ? "bg-blue-600 text-white"
                    : step.current
                    ? "bg-blue-100 text-blue-600 ring-2 ring-blue-600 ring-offset-2"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step.completed ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm">{index + 1}</span>
                )}
              </div>
              <span
                className={`text-sm text-center ${
                  step.completed || step.current
                    ? "text-slate-900"
                    : "text-slate-500"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-full mb-8 ${
                  step.completed ? "bg-blue-600" : "bg-slate-200"
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
